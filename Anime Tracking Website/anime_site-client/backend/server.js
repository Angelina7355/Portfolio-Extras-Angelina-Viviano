// HANDLES REQUESTS BETWEEN REACT AND THE MongoDB DATABASE
const http = require('http');
const { connectToDatabase, getDb } = require('./database');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser'); // Import csv-parser for Anime.csv data file

// Start database connection
connectToDatabase().then(() => {
  }).catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// Create HTTP server
const server = http.createServer(async (req, res) => {

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Allow specific HTTP methods
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allow specific headers

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204); // No Content
    res.end();
    return;
  }

  if (req.url === '/' && req.method === 'GET') {
    // Serve a simple message for the root route
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Welcome to the backend server! Use /api/data to fetch data.');

  } else if (req.url === '/api/data' && req.method === 'GET') {
    // Handle /api/data requests
    // Load dataset from the 'data' folder
    const dataFilePath = path.join(__dirname, 'data', 'Anime.csv'); // Adjust the filename if necessary
    const animeResults = [];

    // Read and parse CSV file
    fs.createReadStream(dataFilePath)
      .pipe(csv()) // Parse CSV
      .on('data', (row) => animeResults.push(row)) // Push each row to results
      .on('end', async () => {
      try {
        const db = getDb();

        // Fetch anime data from the 'anime_data' collection
        const animeCollection = db.collection('anime_data');
        //const animeData = await animeCollection.find().toArray();
        const animeData = await animeCollection.find().limit(50).toArray(); // Fetch a limited number of anime items

        // Fetch users data from the 'users' collection
        const usersCollection = db.collection('users');
        const usersData = await usersCollection.find().toArray();
  
        // Combine the data into one object with users and anime
        const responseData = {
            users: usersData,
            anime: animeData,
            //anime: animeData.concat(animeResults), // Combine both MongoDB data and CSV data

        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(responseData));
     } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to fetch data' }));
    }
  });

  } 
  
  else if (req.url === '/top-anime' && req.method === 'GET') {
    try {
      const db = getDb();
    
      // Fetch top anime from the 'anime_data' collection
      const animeCollection = db.collection('anime_data');
      const topAnime = await animeCollection
        .find()
        .sort({ Score: -1 }) // Sort by score in descending order
        .allowDiskUse(true)  // Enables external sorting
        .limit(5000)  // Limit to top 5000 records first
        .toArray();
  
      const uniqueAnime = [];
      const seenTitles = new Set();
  
      // Iterate through the sorted anime data and filter out duplicates
      for (const anime of topAnime) {
        if (!seenTitles.has(anime.Title)) {
          uniqueAnime.push(anime); // Add unique anime to our list
          seenTitles.add(anime.Title); // Mark the title as seen
        }
  
        if (uniqueAnime.length === 10) break; // Stop once we have 10 unique entries
      }
  
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(uniqueAnime)); // Respond with the unique list of top 10 anime
    } catch (error) {
      console.error('Error fetching top anime:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch top anime', details: error.message }));
    }
  }
  

  else if (req.url.startsWith('/api/search') && req.method === 'GET') {
    try {
      const db = getDb();
  
      // Parse the search query and genre from the URL
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = url.searchParams.get('q') || ""; // Search term
      const genre = url.searchParams.get('genre') || ""; // Genre filter
  
      const animeCollection = db.collection('anime_data'); // Use your actual collection name
  
      // Build the query object dynamically
      let searchQuery = { English: { $regex: query, $options: "i" } }; // Default search by title
      
      if (genre) {
        // If a genre is selected, add it to the query
        searchQuery.Genres = { $in: [genre] };
      }
  
      // Search the anime collection
      const results = await animeCollection
        .find(searchQuery) // Apply title and genre filters
        .limit(20) // Limit the number of results
        .toArray();
  
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
    } catch (error) {
      console.error("Error processing search:", error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  }



  else if (req.url === '/api/login' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const { username, password } = JSON.parse(body);

        // Insert into MongoDB
        const db = getDb();
        const usersCollection = db.collection('users');
        // Check if the username already exists
        const existingUser = await usersCollection.findOne({ name: username });
        if (!existingUser) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Username does not exist' }));
        }

        if (existingUser.pass !== password) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Incorrect password' }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Login successful' }));
      } catch (error) {
        console.error('Error registering user:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Failed to login' }));
      }
    });
  }

  else if (req.url === '/api/register' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const { username, password } = JSON.parse(body);


        // Insert into MongoDB
        const db = getDb();
        const usersCollection = db.collection('users');
        // Check if the username already exists
        const existingUser = await usersCollection.findOne({ name: username });
        if (existingUser) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Username already exists. Please choose another one.' }));
            return;
        }

        const result = usersCollection.insertOne({ name: username, pass: password});

        console.log("User successfully inserted:", result); // Log the result of the DB operation
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'User registered successfully' }));
      } catch (error) {
        console.error('Error registering user:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Failed to register user' }));
      }
    });
  }

 else if (req.url === '/api/watchlist' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
  
    req.on('end', async () => {
      try {
        const { username, animeItem } = JSON.parse(body); // Parse username and animeItem
  
        // Connect to the database
        const db = getDb();
        const usersCollection = db.collection('users');
  
        // Update the user's 'watched' array with the new animeItem
        const result = await usersCollection.updateOne(
          { name: username }, // Find the user by username
          { $push: { watchlist: animeItem } } // Add animeItem to the 'watched' array
        );
  
        if (result.modifiedCount === 1) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Anime item added to watchlist' }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'User not found or no changes made' }));
        }
      } catch (error) {
        console.error('Error adding to watchlist:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
      }
    });
  }  

  else if (req.url === '/api/deletewatchlist' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
  
    req.on('end', async () => {
      try {
        const { username, animeItem } = JSON.parse(body); // Parse username and animeItem
  
        // Connect to the database
        const db = getDb();
        const usersCollection = db.collection('users');
  
        // Remove animeItem from the user's watchlist using the $pull operator
        const result = await usersCollection.updateOne(
          { name: username }, // Find the user by username
          { $pull: { watchlist: animeItem } } // Remove animeItem from the 'watchlist' array
        );
  
        if (result.modifiedCount === 1) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Anime item removed from watchlist' }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'User not found or no changes made' }));
        }
      } catch (error) {
        console.error('Error deleting from watchlist:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
      }
    });
  }
  
  

  else if (req.url === '/api/getwatchlist' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { username } = JSON.parse(body); // Parse username from the request

        // Connect to the database
        const db = getDb();
        const usersCollection = db.collection('users');

        // Fetch the user's watchlist (i.e., the 'watched' array)
        const user = await usersCollection.findOne({ name: username });

        if (user) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, watchlist: user.watchlist }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'User not found' }));
        }
      } catch (error) {
        console.error('Error retrieving watchlist:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
      }
    });
  }

  else if (req.url === '/api/addwatched' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
  
    req.on('end', async () => {
      try {
        const { username, animeItem } = JSON.parse(body); // Parse username and animeItem
  
        // Connect to the database
        const db = getDb();
        const usersCollection = db.collection('users');
  
        // Update the user's 'watched' array with the new animeItem
        const result = await usersCollection.updateOne(
          { name: username }, // Find the user by username
          { $push: { watched: animeItem } } // Add animeItem to the 'watched' array
        );
  
        if (result.modifiedCount === 1) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Anime item added to watched' }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'User not found or no changes made' }));
        }
      } catch (error) {
        console.error('Error adding to watchlist:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
      }
    });
  } 

  else if (req.url === '/api/deletewatched' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
  
    req.on('end', async () => {
      try {
        const { username, animeItem } = JSON.parse(body); // Parse username and animeItem
  
        // Connect to the database
        const db = getDb();
        const usersCollection = db.collection('users');
  
        // Remove animeItem from the user's watchlist using the $pull operator
        const result = await usersCollection.updateOne(
          { name: username }, // Find the user by username
          { $pull: { watched: animeItem } } // Remove animeItem from the 'watched' array
        );
  
        if (result.modifiedCount === 1) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Anime item removed from watched' }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'User not found or no changes made' }));
        }
      } catch (error) {
        console.error('Error deleting from watched:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
      }
    });
  }

  else if (req.url === '/api/getwatched' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { username } = JSON.parse(body); // Parse username from the request

        // Connect to the database
        const db = getDb();
        const usersCollection = db.collection('users');

        // Fetch the user's watchlist (i.e., the 'watched' array)
        const user = await usersCollection.findOne({ name: username });

        if (user) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, watched: user.watched }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'User not found' }));
        }
      } catch (error) {
        console.error('Error retrieving watched:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
      }
    });
  }

  else if (req.url === '/api/addfavorite' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
  
    req.on('end', async () => {
      try {
        const { username, animeItem } = JSON.parse(body); // Parse username and animeItem
  
        // Connect to the database
        const db = getDb();
        const usersCollection = db.collection('users');
  
        // Update the user's 'watched' array with the new animeItem
        const result = await usersCollection.updateOne(
          { name: username }, // Find the user by username
          { $push: { favorite: animeItem } } // Add animeItem to the 'watched' array
        );
  
        if (result.modifiedCount === 1) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Anime item added to favoites' }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'User not found or no changes made' }));
        }
      } catch (error) {
        console.error('Error adding to favorite:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
      }
    });
  } 

  else if (req.url === '/api/deletefavorite' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
  
    req.on('end', async () => {
      try {
        const { username, animeItem } = JSON.parse(body); // Parse username and animeItem
  
        // Connect to the database
        const db = getDb();
        const usersCollection = db.collection('users');
  
        // Remove animeItem from the user's watchlist using the $pull operator
        const result = await usersCollection.updateOne(
          { name: username }, // Find the user by username
          { $pull: { favorite: animeItem } } // Remove animeItem from the 'watched' array
        );
  
        if (result.modifiedCount === 1) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Anime item removed from favorite' }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'User not found or no changes made' }));
        }
      } catch (error) {
        console.error('Error deleting from favorite:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
      }
    });
  }

  else if (req.url === '/api/getfavorite' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { username } = JSON.parse(body); // Parse username from the request

        // Connect to the database
        const db = getDb();
        const usersCollection = db.collection('users');

        // Fetch the user's watchlist (i.e., the 'watched' array)
        const user = await usersCollection.findOne({ name: username });

        if (user) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, favorite: user.favorite }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'User not found' }));
        }
      } catch (error) {
        console.error('Error retrieving favorites:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
      }
    });
  }

  else if (req.url === '/api/rateanime' && req.method === 'POST') {
    let body = '';
  
    // Collect data from the request body
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
  
    // Once data is fully received
    req.on('end', async () => {
      try {
        const { username, animeItem, rating } = JSON.parse(body); // Parse the data (username, animeItem, rating)
  
        // Ensure that all necessary fields are provided
        if (!username || !animeItem || typeof rating === 'undefined') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Missing data' }));
          return;
        }
  
        // Connect to the database
        const db = getDb();
        const usersCollection = db.collection('users');
  
        // Remove any existing rating for the same anime
        const pullResult = await usersCollection.updateOne(
          { name: username }, // Find the user by their username
          {
            $pull: {
              rating: { anime: animeItem.English }, // Remove the old rating for the same anime
            },
          }
        );
  
        // Add the new rating
        const pushResult = await usersCollection.updateOne(
          { name: username }, // Find the user by their username
          {
            $push: {
              rating: {
                anime: animeItem.English, // Store the anime's English name or a unique identifier
                rating: rating,           // Store the rating value
              },
            },
          }
        );
  
        // Check if the operation was successful
        if (pushResult.modifiedCount === 1) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: true,
              message: pullResult.modifiedCount > 0
                ? 'Rating updated successfully!'
                : 'Rating added successfully!',
            })
          );
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: 'User not found or no changes made',
            })
          );
        }
      } catch (error) {
        console.error('Error updating rating:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
      }
    });
  }
  

  else if (req.url === '/api/getratings' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
  
    req.on('end', async () => {
      try {
        const { username } = JSON.parse(body); // Parse username from the request
  
        // Connect to the database
        const db = getDb();
        const usersCollection = db.collection('users');
  
        // Fetch the user's ratings (i.e., the 'rating' array)
        const user = await usersCollection.findOne({ name: username });
  
        if (user) {
          // Assuming user.rating is an array of objects with 'anime' (anime name) and 'rating' (rating value)
          const ratings = user.rating || []; // Get the ratings array, if it exists
  
          // Map ratings to create {anime, rating} pairs
          const ratingsWithAnime = ratings.map((ratingItem) => ({
            anime: ratingItem.anime, // Anime name as string (English name)
            rating: ratingItem.rating, // Rating as a string
          }));
  
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, ratings: ratingsWithAnime }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'User not found' }));
        }
      } catch (error) {
        console.error('Error retrieving ratings:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
      }
    });
  }
  
  else if (req.url === '/api/saveGenres' && req.method === 'POST') {
    let body = '';
  
    // Collect data from the request body
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
  
    // Once data is fully received
    req.on('end', async () => {
      try {
        const { username, genres } = JSON.parse(body); // Parse the data (username and genres)
  
        // Ensure that all necessary fields are provided
        if (!username || !Array.isArray(genres)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Missing or invalid data' }));
          return;
        }
  
        // If genres array is empty, clear the likedGenres field for the user
        const updatedGenres = genres.length === 0 ? null : genres;
  
        // Connect to the database
        const db = getDb();
        const usersCollection = db.collection('users');
  
        // Update the user's liked genres
        const updateResult = await usersCollection.updateOne(
          { name: username }, // Find the user by their username
          {
            $set: { likedGenres: updatedGenres }, // Set likedGenres to null if no genres are provided
          },
          { upsert: true } // Create a new document if the user does not exist
        );
  
        // Check if the operation was successful
        if (updateResult.matchedCount === 1 || updateResult.upsertedCount === 1) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Genres saved successfully!' }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'User not found or no changes made' }));
        }
      } catch (error) {
        console.error('Error saving genres:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
      }
    });
  }
  
  
  else if (req.url === '/api/getgenres' && req.method === 'POST') {
    let body = '';
    
    // Collect data from the request body
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
  
    req.on('end', async () => {
      try {
        const { username } = JSON.parse(body); // Parse the username from the request body
  
        // Connect to the database
        const db = getDb();
        const usersCollection = db.collection('users');
  
        // Fetch the user's liked genres (i.e., the 'Liked_Genres' array)
        const user = await usersCollection.findOne({ name: username });
  
        if (user) {
          const likedGenres = user.likedGenres || []; // Get the liked genres array, if it exists
  
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, likedGenres })); // Send liked genres back to the frontend
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'User not found' }));
        }
      } catch (error) {
        console.error('Error retrieving liked genres:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
      }
    });
  }
  


  else if (req.url === '/load-csv' && req.method === 'POST') {
    // End.point to load CSV data into MongoDB
    try {
        const animeCollection = getDb().collection('anime_data');
        const filePath = path.join(__dirname, 'data', 'Anime.csv'); // Adjust to your path
  
        const results = [];
  
        // Read and parse CSV file
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', async () => {
            try {
              // Insert parsed data into MongoDB collection
              await animeCollection.insertMany(results);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ message: 'CSV data loaded successfully' }));
            } catch (error) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to insert CSV data into MongoDB' }));
            }
          });
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error processing CSV file' }));
      }

    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Route not found' }));
    }
  });

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
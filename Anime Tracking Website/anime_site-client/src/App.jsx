import './App.css';
import { useEffect, useState } from 'react';

/**
 * This is the full front-end of the page for weebsite

 * @returns The final page that allows one to find new anime and make
an account to customize 
 */

function Main() {
  const [users, setUsers] = useState([]); // State to hold the fetched data
  const [anime, setAnime] = useState([]); // State to hold anime data
  const [error, setError] = useState(null); // State to handle errors
  const [searchTerm, setSearchTerm] = useState(""); // State for the search term
  const [searchResults, setSearchResults] = useState([]); // State for search results
  const [showResults, setShowResults] = useState(false);  // State for hiding search results
  const [hasSearched, setHasSearched] = useState(false); // Track if user has searched
  const [selectedSearchGenres, setSelectedSearchGenres] = useState([]); // Track selected genres for search results
  const [watchlist, setWatchlist] = useState([]); // State for the watchlist
  const [watched, setWatched] = useState([]); // State for the watched
  const [curUser, setCurUser] = useState(() => {
    return localStorage.getItem('curUser') || ""; // Retrieve saved user or default to empty
  });
  const [topAnime, setTopAnime] = useState([]); // State for the top 10 anime
  const [activeWatchlistIndex, setActiveWatchlistIndex] = useState(null);
  const [activeWatchedIndex, setActiveWatchedIndex] = useState(null);
  const[activeFavoriteIndex, setActiveFavoriteIndex] = useState(null);
  const [favorite, setFavorite] = useState([]);
  const [isClicked, setIsClicked] = useState(false); // State to track button click
  const [rating, setRating] = useState([]); // State to store the rating input
  const [activeAnimeDetailsIndex, setActiveAnimeDetailsIndex] = useState(null); // Track the active anime for details view
  const [selectedGenres, setSelectedGenres] = useState([]); // State for selected genres
  const [genres, setGenres] = useState([
    "Action",
    "Adventure",
    "Suspense",
    "Comedy",
    "Mystery",
    "Drama",
    "Sports",
    "Fantasy",
    "Horror",
    "Romance",
    "Sci-Fi",
  ]); // Example list of genres
  const [randomizedAnime, setRandomizedAnime] = useState([]); // State to hold the randomized anime

  

  // Fetch top anime on component mount
  useEffect(() => {
    fetch('http://localhost:3000/top-anime')
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch top anime");
        }
        return response.json();
      })
      .then((data) => {
        setTopAnime(data);
      })
      .catch((error) => console.error("Error fetching top anime:", error));
  }, []);

  // Fetch other data on mount (users and anime)
  // triggers on component mount (when App() is rendered on the page.)
  useEffect(() => {
    const apiUrl = "http://localhost:3000/api/data" // user data
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(data => {
        setUsers(data.users); // Set the fetched users data
        setAnime(data.anime); // Set the fetched anime data
        console.log("Number of anime fetched:", data.anime.length);
        
        // Randomize the anime once after data is fetched
        const randomAnime = () => {
          const shuffled = [...data.anime].sort(() => Math.random() - 0.5); // Shuffle the anime array
          const randomCount = Math.floor(Math.random() * 11) + 30; // Random number between 30 and 40
          return shuffled.slice(0, randomCount); // Return the first 30-40 anime
        };
        setRandomizedAnime(randomAnime()); // Set the randomized anime to state
      })
      .catch((err) => {
          setError(err.message); // Handle any errors
      });
  }, []); // Empty dependency array ensures this runs once when the component mounts
  
  useEffect(() => {
    if (curUser !== "") {
      fetch('http://localhost:3000/api/getwatchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: curUser }), // Send the username in the request body
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setWatchlist(data.watchlist || []); // Ensure watchlist is always an array
            console.log('Retrieved data:', data); // Log the retrieved data
          } else {
            setWatchlist([]);
            console.error('Error fetching watchlist:', data.error);
          }
        })
        .catch((err) => console.error('Error:', err));
    }
  }, [curUser]); // Trigger the fetch when curUser changes


  useEffect(() => {
    if (curUser !== "") {
      fetch('http://localhost:3000/api/getwatched', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: curUser }), // Send the username in the request body
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setWatched(data.watched || []); // Ensure watched is always an array
          } else {
            console.error('Error fetching watched:', data.error);
            setWatched([]); // Set watched to an empty array on error
          }
        })
        .catch((err) => console.error('Error:', err));
    }
  }, [curUser]); // Trigger the fetch when curUser changes

  useEffect(() => {
    if (curUser !== "") {
      fetch('http://localhost:3000/api/getfavorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: curUser }), // Send the username in the request body
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setFavorite(data.watched || []); // Ensure Favorite is always an array
          } else {
            console.error('Error fetching favorite:', data.error);
            setFavorite([]); // Set Favorite to an empty array on error
          }
        })
        .catch((err) => console.error('Error:', err));
    }
  }, [curUser]); // Trigger the fetch when curUser changes

  useEffect(() => {
    if (curUser !== "") {
      fetch('http://localhost:3000/api/getratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: curUser }), // Send the username in the request body
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setRating(data.ratings || []); // Ensure ratings is always an array
            console.log('Retrieved ratings data:', data); // Log the retrieved data
          } else {
            setRating([]);
            console.error('Error fetching ratings:', data.error);
          }
        })
        .catch((err) => console.error('Error:', err));
    }
  }, [curUser]); // Trigger the fetch when curUser changes
  
  useEffect(() => {
    if (curUser !== "") {
      fetch('http://localhost:3000/api/getgenres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: curUser }), // Send the username in the request body
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setSelectedGenres(data.likedGenres || []); // Ensure likedGenres is always an array
            console.log('Retrieved liked genres:', data); // Log the retrieved data
          } else {
            setSelectedGenres([]);
            console.error('Error fetching liked genres:', data.error);
          }
        })
        .catch((err) => console.error('Error:', err));
    }
  }, [curUser]); // Trigger the fetch when curUser changes
  

  useEffect(() => {
    if (curUser) {
      localStorage.setItem('curUser', curUser);
    } else {
      localStorage.removeItem('curUser'); // Remove from localStorage if curUser is empty
    }
  }, [curUser]);
  
  const handleCreate = (e) => {
    e.preventDefault();
    const username = document.getElementById('userNameInput').value.trim();
    const password = document.getElementById('userPasswordInput').value.trim();
  
    if (!username || !password) {
      alert("Both username and password fields are required.");
      return; // Stop execution if fields are empty
    }
  
    // Clear the inputs
    document.getElementById('userNameInput').value = "";
    document.getElementById('userPasswordInput').value = "";
  
    // Send the username and password to the backend
    fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert('User registered successfully!');
          setCurUser(username);
          setUsers((prevUsers) => [...prevUsers, { name: username, _id: Date.now().toString() }]); // Update the users list
        } else {
          alert(`Error: ${data.message}`);
        }
      })
      .catch((err) => console.error('Error:', err));
  };
  

  const handleLogin = (e) => {
    e.preventDefault();
    const username = document.getElementById('userInput').value;
    const password = document.getElementById('userPassInput').value;
    if (!username || !password) {
      alert("Both username and password fields are required.");
      return; // Stop execution if fields are empty
    }
    document.getElementById('userInput').value = "";
    document.getElementById('userPassInput').value = "";

    // Send the username and password to the backend
    fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert('User Login successful!');
          setCurUser(username); 
        } else {
          alert(`Error: ${data.message}`);
        }
      })
      .catch((err) => console.error('Error:', err));
  };

  const handleLogout = () => { // Logout the user
    setCurUser(""); // Reset current user to empty
    setWatchlist([]); // Clear any user-specific data
    setWatched([]); // Clear watched list
    setFavorite([]); // Clear favorites
    alert("You have been logged out.");
  };
  


  // Send user search to backend
  const handleSearch = async () => {
    //if (!searchTerm) return; // Prevent empty searches
    try {
      // const response = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(searchTerm)}`);
      const response = await fetch(
        `http://localhost:3000/api/search?q=${encodeURIComponent(searchTerm)}&genre=${encodeURIComponent(selectedSearchGenres)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch search results");
      }
      let results = await response.json();

      // Filter by genre if a genre is selected
      if (selectedSearchGenres) {
        results = results.filter((anime) => anime.Genres.includes(selectedSearchGenres));
      }

      setSearchResults(results);
      setShowResults(true); // Show results when search completes
      setHasSearched(true); // Mark that the user has searched
    } catch (error) {
      console.error(error);
    }
  };


  const handleHideResults = () => {
    setShowResults(false); // Hide results when the button is clicked
  };

  const handleGenreChange = (e, genre) => {
    if (e.target.checked) {
      setSelectedSearchGenres([...selectedSearchGenres, genre]); // Add selected genre
    } else {
      setSelectedSearchGenres(selectedSearchGenres.filter((g) => g !== genre)); // Remove unselected genre
    }
  };
  
  // add searched anime to user's watchlist
  const addToWatchlist = (animeItem) => {
    if (!curUser) {
      alert("Please log in to add items to your watchlist.");
      return;
    }

    fetch('http://localhost:3000/api/watchlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: curUser, animeItem }), // Include username and animeItem
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log('Anime item added to watchlist successfully.');
          setWatchlist((prev) => (Array.isArray(prev) ? [...prev, animeItem] : [animeItem]));
        } else {
          console.error('Error adding anime item to watchlist:', data.error);
        }
      })
      .catch((err) => {
        console.error('Error sending anime item to backend:', err);
      });

  };

  
  const deleteFromWatch = (animeItem) => {
    if (!curUser) {
      alert("Please log in to remove items from your watchlist.");
      return;
    }
  
    fetch('http://localhost:3000/api/deletewatchlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: curUser, animeItem }), // Include username and animeItem
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log('Anime item deleted from watchlist successfully.');
          // Update the watchlist by filtering out the deleted anime
          setWatchlist((prev) =>
            prev.filter((watchlistItem) => JSON.stringify(watchlistItem) !== JSON.stringify(animeItem))
          );
        } else {
          console.error('Error deleting anime item from watchlist:', data.error);
        }
      })
      .catch((err) => {
        console.error('Error sending anime item to backend:', err);
      });
  };
  


  const addToWatched = (animeItem) => {
    if (!curUser) {
      alert("Please log in to add items to your watchlist.");
      return;
    }

    fetch('http://localhost:3000/api/addwatched', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: curUser, animeItem }), // Include username and animeItem
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log('Anime item added to watched anime successfully.');
          setWatched((prev) => (Array.isArray(prev) ? [...prev, animeItem] : [animeItem]));
        } else {
          console.error('Error adding anime item to watched:', data.error);
        }
      })
      .catch((err) => {
        console.error('Error sending anime item to backend:', err);
      });
    }

    const deleteFromWatched = (animeItem) => {
      if (!curUser) {
        alert("Please log in to add items to your watched.");
        return;
      }
  
      fetch('http://localhost:3000/api/deletewatched', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: curUser, animeItem }), // Include username and animeItem
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            console.log('Anime item deleted from watched successfully.');
            setWatched((prev) =>
              prev.filter((watchedItem) => JSON.stringify(watchedItem) !== JSON.stringify(animeItem))
            );
          } else {
            console.error('Error deleteing anime item from watched:', data.error);
          }
        })
        .catch((err) => {
          console.error('Error sending anime item to backend:', err);
        });
  
    };
  

    const addFavorite = (animeItem) => {
      if (!curUser) {
        alert("Please login or create an account to add items to your watchlist.");
        return;
      }
  
      fetch('http://localhost:3000/api/addfavorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: curUser, animeItem }), // Include username and animeItem
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            console.log('Anime item added to favorites successfully.');
            setFavorite((prev) => (Array.isArray(prev) ? [...prev, animeItem] : [animeItem]));
          } else {
            console.error('Error adding anime item to favorites:', data.error);
          }
        })
        .catch((err) => {
          console.error('Error sending anime item to backend:', err);
        });
      }

      const unfavorite = (animeItem) => {
        if (!curUser) {
          alert("Please log in to remove items to your favorites.");
          return;

        }
    
        fetch('http://localhost:3000/api/deletefavorite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: curUser, animeItem }), // Include username and animeItem
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              console.log('Anime item deleted from favorites successfully.');
              setFavorite((prev) =>
                prev.filter((item) => item.English !== animeItem.English) // Remove by the English name or unique identifier
            );
    
            } else {
              console.error('Error deleteing anime item from favorite:', data.error);
            }
          })
          .catch((err) => {
            console.error('Error sending anime item to backend:', err);
          });
    
      };

      const rateAnime = (animeItem, ratingValue) => {
        if (ratingValue < 0 || ratingValue > 10 || isNaN(ratingValue)) {
          alert("Please enter a valid rating between 0 and 10.");
          return;
        }
      
        fetch('http://localhost:3000/api/rateanime', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: curUser,
            animeItem,
            rating: parseFloat(ratingValue), // Ensure rating is a decimal value
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
      
              // Update the ratings state
              setRating((prevRatings) => {
                // Remove any previous rating for this anime
                const updatedRatings = prevRatings.filter(
                  (ratingItem) => ratingItem.anime !== animeItem.English
                );
                return [
                  ...updatedRatings,
                  { anime: animeItem.English, rating: ratingValue },
                ];
              });
      
              // Update the watched state
              setWatched((prevWatched) =>
                prevWatched.map((item) =>
                  item.English === animeItem.English
                    ? { ...item, rating: ratingValue }
                    : item
                )
              );
            } else {
              alert(`Error: ${data.error}`);
            }
          })
          .catch((err) => console.error("Error:", err));
      };
      

      const saveGenresToAccount = () => {
        if (!curUser) {
          alert("Please login or create an account to save your favorite genres.");
          return;
        }
      
        fetch("http://localhost:3000/api/saveGenres", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: curUser, genres: selectedGenres }), // Include username and selected genres
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              console.log("Favorite genres saved successfully.");
            } else {
              console.error("Error saving favorite genres:", data.error);
            }
          })
          .catch((err) => {
            console.error("Error sending genres to backend:", err);
            alert("An error occurred while saving your genres.");
          });
      };
      

      const toggleGenreSelection = (genre) => {
        setSelectedGenres((prev) =>
          prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
        );
      };



  if (error) {
    return <div>Error: {error}</div>;
  }

  if (users.length === 0) {
    return <div>Loading data...</div>; // Show a loading message while data is fetched
  }

  return (
    <div className="app-container">
    <header className="app-header">
      <h1>The Weebsite</h1>
      <img src="anime-eyes-logo.png" alt="Logo" className="header-logo" />
    </header>

    <main className="main-content">


      {curUser === "" && (
        <section className="login-section">
          <form>
            <h2>Login or Create Account</h2>
            <div>
              <label>Username:</label>
              <input type="text" id="userNameInput" />
            </div>
            <div>
              <label>Password:</label>
              <input type="password" id="userPasswordInput" />
            </div>
            <button onClick={handleCreate}>Create</button>

            <div>
              <label>Username:</label>
              <input type="text" id="userInput" />
            </div>
            <div>
              <label>Password:</label>
              <input type="password" id="userPassInput" />
            </div>
            <button onClick={handleLogin}>Login</button>
          </form>
          <br></br>
          <h2>Once you login or create account you can see recommended anime :3</h2>
        </section>
      )}

      {curUser !== "" && !isClicked && (
        <button onClick={() => setIsClicked(true)}>View Profile</button>
      )}


      {curUser !== "" && (
        <button
          onClick={() => {
            handleLogout(); // Call the existing logout function
            setIsClicked(false); // Set isClicked to false
          }}
        >
          Logout
        </button>
      )}


      {isClicked && curUser !== "" && (
          <button onClick={() => setIsClicked(false)}>Back to Main Menu</button>
      )}



      <br></br>
      <section className="search-section">
        <h2>Search Anime</h2>
        <div className="search-bar">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for anime..."
          />
          <button onClick={handleSearch}>Search</button>

          {hasSearched && (
            showResults ? (
              <button onClick={handleHideResults}>Hide Results</button>
            ) : (
              <button onClick={() => setShowResults(true)} disabled={searchResults.length === 0}>
                Show Results
              </button>
            )
          )}
        </div>

        <div className="genre-selection">
          <label>Filter Search by Genre:</label>
          {["Action", "Adventure", "Suspense", "Comedy", "Mystery", "Drama", "Sports", "Fantasy", "Horror", "Romance", "Sci-Fi"].map((genre) => (
            <div key={genre}>
              <input
                type="checkbox"
                id={genre}
                value={genre}
                checked={selectedSearchGenres.includes(genre)}
                onChange={(e) => handleGenreChange(e, genre)}
              />
              <label htmlFor={genre}>{genre}</label>
            </div>
          ))}
        </div>
      





      {showResults && (
        <section className="search-results">
          {searchResults.length > 0 ? (
            <>
              <h2>Search Results</h2>
              <ul>
                {searchResults
                .filter((animeItem) => {
                  // If no genres are selected, show all results
                  if (selectedSearchGenres.length === 0) return true;
                  // Check if anime has at least one matching genre from selectedSearchGenres
                  return selectedSearchGenres.some((genre) => animeItem.Genres.includes(genre));
                })
                .map((animeItem, index) => {
                  // Check if anime is already in the watchlist
                  const isInWatchlist = watchlist.some((watchlistItem) => {
                    return JSON.stringify(watchlistItem) === JSON.stringify(animeItem);
                  });
                  return (
                    <li key={index} className="anime-item">
                      <span>{animeItem.English}</span>
                      {isInWatchlist ? (
                        <button onClick={() => deleteFromWatch(animeItem)}>Remove from Watchlist</button>
                      ) : (
                        <button onClick={() => addToWatchlist(animeItem)}>Add to Watchlist</button>
                      )}
                      <button onClick={() => setActiveAnimeDetailsIndex(activeAnimeDetailsIndex === index ? null : index)}
                        style={{ marginLeft: '15px' }}>
                      {activeAnimeDetailsIndex === index ? 'Close' : 'Details'}
                        </button>

                        {activeAnimeDetailsIndex === index && (
                          <div>
                            <p><strong>Japanese Name:</strong> {animeItem.Japanese || "Not Available"}</p>
                            <p><strong>Episodes:</strong> {animeItem.Episodes || "Unknown"}</p>
                            <p><strong>Community Score:</strong> {animeItem.Score || "No score"}</p>
                            <p><strong>Number of Ratings:</strong> {animeItem.Scored_Users || "Not available"}</p>
                            <p><strong>Genres:</strong> {animeItem.Genres || "No genres listed"}</p>
                          </div>
                        )}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p>No results found. Try searching for something else!</p>
          )}
        </section>
      )}
      </section>


    {isClicked && curUser !== "" && (
      <h3>{curUser}'s profile</h3>
    )}

{isClicked && curUser !== "" && (
  <>


    <section className="likedGenre">
      <h2>Favorite Genre(s):</h2>
      <ul className="genre-list">
        {genres.map((genre) => (
          <li key={genre}>
            <label>
              <input
                type="checkbox"
                checked={selectedGenres.includes(genre)}
                onChange={() => toggleGenreSelection(genre)}
              />
              {genre}
            </label>
          </li>
        ))}
      </ul>
      <button onClick={saveGenresToAccount}>Save Favorite Genres</button>
    </section>

    <section className="watchlist">
      <h2>Your Watchlist</h2>
      <ul>
        {watchlist.length > 0 ? (
          watchlist.map((animeItem, index) => {
            const isInWatched = watched.some(
              (watchedItem) => watchedItem.English === animeItem.English
            );

            return (
              <li key={index} className="anime-item">
                {animeItem.English || "Unnamed Anime"}
                {activeWatchlistIndex !== index && (
                  <button onClick={() => setActiveWatchlistIndex(index)}>Action</button>
                )}
                {activeWatchlistIndex === index && (
                  <div>
                    <button
                      onClick={() => {
                        deleteFromWatch(animeItem);
                        setWatchlist((prev) =>
                          prev.filter((item, i) => i !== index)
                        );
                        setActiveWatchlistIndex(null);
                      }}
                    >
                      Delete from Watchlist
                    </button>
                    {!isInWatched && (
                      <button
                        onClick={() => {
                          addToWatched(animeItem);
                          setActiveWatchlistIndex(null);
                        }}
                      >
                        Add to Watched
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })
        ) : (
          <p>Your watchlist is empty.</p>
        )}
      </ul>
    </section>

    <section className="watched">
      <h2>Your Watched List</h2>
      <ul>
        {watched.length > 0 ? (
          watched.map((animeItem, index) => {
            // Check if the anime already has a rating
            const ratingExist =
              Array.isArray(rating) &&
              rating.some((ratingItem) => ratingItem.anime === animeItem.English);

            const animeRating = ratingExist
              ? rating.find((ratingItem) => ratingItem.anime === animeItem.English)?.rating
              : "No rating";

            return (
              <li key={index} className="anime-item">
                <span>{animeItem.English || "Unnamed Anime"}</span>
                <span className="anime-rating">Rating: {animeRating}</span>
                {activeWatchedIndex !== index && (
                  <button onClick={() => setActiveWatchedIndex(index)}>Action</button>
                )}
                {activeWatchedIndex === index && (
                  <div>
                    <button
                      onClick={() => {
                        deleteFromWatched(animeItem);
                        setWatched((prev) => prev.filter((item, i) => i !== index));
                        setActiveWatchedIndex(null);
                      }}
                    >
                      Remove from Watched
                    </button>
                    {!favorite.some(
                      (favItem) => favItem.English === animeItem.English
                    ) ? (
                      <button onClick={() => addFavorite(animeItem)}>
                        Add to Favorite
                      </button>
                    ) : (
                      <button onClick={() => unfavorite(animeItem)}>
                        Unfavorite
                      </button>
                    )}
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        placeholder="Rate (0-10)"
                        onChange={(e) => setIsClicked(e.target.value)} // Temporarily hold the rating value
                      />
                      <button
                        onClick={() => {
                          rateAnime(animeItem, isClicked); // Submit the rating
                          setActiveWatchedIndex(null); // Collapse the rating input section
                        }}
                      >
                        Submit Rating
                      </button>
                      <button onClick={() => setActiveWatchedIndex(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })
        ) : (
          <li className="anime-item">No anime in your watched list.</li>
        )}
      </ul>
    </section>

    <section className="favorites-section">
      <h2>Your Favorite List</h2>
      <ul>
        {favorite.length > 0 ? (
          favorite
            .map((animeItem) => {
              const animeRating = Array.isArray(rating)
                ? rating.find((ratingItem) => ratingItem.anime === animeItem.English)?.rating
                : null;

              return {
                ...animeItem,
                rating: animeRating !== undefined ? animeRating : null, // Add rating to the anime object
              };
            })
            .sort((a, b) => {
              if (a.rating === null && b.rating !== null) return 1; // Unrated comes after rated
              if (a.rating !== null && b.rating === null) return -1; // Rated comes before unrated
              if (a.rating === null && b.rating === null) return 0; // Both unrated, maintain order
              return b.rating - a.rating; // Sort by rating, highest first
            })
            .map((animeItem, index) => (
              <li key={index} className="anime-item">
                {animeItem.English || "Unnamed Anime"}{" "}
                {animeItem.rating !== null && <span>Rating: {animeItem.rating}</span>}
                {activeFavoriteIndex !== index && (
                  <button onClick={() => setActiveFavoriteIndex(index)}>Action</button>
                )}
                {activeFavoriteIndex === index && (
                  <div>
                    <button
                      onClick={() => {
                        unfavorite(animeItem);
                        setFavorite((prev) =>
                          prev.filter((item, i) => i !== index)
                        );
                        setActiveFavoriteIndex(null);
                      }}
                    >
                      Remove from Favorites
                    </button>
                  </div>
                )}
              </li>
            ))
        ) : (
          <li className="anime-item">No anime in your favorite list.</li>
        )}
      </ul>
    </section>


  </>
)}

<br></br>
      

<section className="top-recommendation-container">
{!isClicked && (
  <section className="top-anime">
    <h2>Top 10 Anime by Score</h2>
    <ul>
      {anime
        .sort((a, b) => b.Score - a.Score)  // Sort by Score in descending order
        .slice(0, 10)  // Limit to the top 10 anime
        .map((animeItem, index) => (
          <li key={index}>
            <strong>{animeItem.Title || "Unnamed Anime"}</strong>: {animeItem.Score || "No score available"}/10
          </li>
        ))}
    </ul>
  </section>
)}


{!isClicked && curUser !== "" && (
  selectedGenres.length > 0 ? (
    <section className="recommended-anime">
      <h2>Recommended Anime for {curUser}</h2>
      <ul>
        {anime
          .filter((animeItem) => 
            selectedGenres.some(genre => animeItem.Genres.includes(genre)) // Filter by selected genres
          )
          .sort((a, b) => b.Score - a.Score) // Sort by rating in descending order
          .slice(0, 10) // Limit to top 10
          .map((animeItem, index) => (
            <li key={index}>
              <strong>{animeItem.Title || "Unnamed Anime"}</strong>: {animeItem.Score}/10
            </li>
          ))}
      </ul>
    </section>
  ) : (
    <section className="no-genres-selected">
      <h2>Go to your profile to choose your favorite genres and see what anime we can recommend!</h2>
    </section>
  )
)}
</section>


{!isClicked && (
    <div className="more-anime-section">
      <h1>More Anime</h1>
      <ul>
        {randomizedAnime.map((animeItem, index) => (
          <li key={index}>
            <div>
              <span>{animeItem.English || "Unnamed Anime"}</span>

              <button onClick={() => setActiveAnimeDetailsIndex(activeAnimeDetailsIndex === index ? null : index)}
                style={{ marginLeft: '15px' }}>
                {activeAnimeDetailsIndex === index ? 'Close' : 'Details'}
              </button>

              {activeAnimeDetailsIndex === index && (
                <div>
                  <p><strong>Japanese Name:</strong> {animeItem.Japanese || "Not Available"}</p>
                  <p><strong>Episodes:</strong> {animeItem.Episodes || "Unknown"}</p>
                  <p><strong>Community Score:</strong> {animeItem.Score || "No score"}</p>
                  <p><strong>Number of Ratings:</strong> {animeItem.Scored_Users || "Not available"}</p>
                  <p><strong>Genres:</strong> {animeItem.Genres || "No genres listed"}</p>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
)}



      <h1>Change Background Color</h1>
      <div>
        <button onClick={() => document.body.style.backgroundColor = "rgb(204, 153, 255)"}>Light Purple</button>
        <button onClick={() => document.body.style.backgroundColor = "rgb(205, 127, 50)"}>Bronze</button>
        <button onClick={() => document.body.style.backgroundColor = "rgb(137, 207, 240)"}>Baby Blue</button>
        <button onClick={() => document.body.style.backgroundColor = ""}>Default</button>
      </div>


    </main>

    <footer className="app-footer">
      <p>&copy; 2024 The Weebsite</p>
    </footer>
  </div>
);

}

export default Main
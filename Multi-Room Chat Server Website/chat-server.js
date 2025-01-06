// SERVER SIDE OF CHAT (runs on a Node.js server and communicates with the user's browser using socket.io)
// Require the packages we will use:
const http = require("http"),
    fs = require("fs");

const port = 3456;
const file = "chatRoom.html";
// Listen for HTTP connections.  This is essentially a miniature static file server that only serves our one file, client.html, on port 3456:
const server = http.createServer(function (req, res) {
    // This callback runs when a new connection is made to our HTTP server.

    fs.readFile(file, function (err, data) {
        // This callback runs when the client.html file has been read from the filesystem.

        if (err) return res.writeHead(500);
        res.writeHead(200);
        res.end(data);
    });
});
server.listen(port);

// Import Socket.IO and pass our HTTP server object to it.
const socketio = require("socket.io")(http, {
    wsEngine: 'ws'
});

// Attach our Socket.IO server to our HTTP server to listen
const io = socketio.listen(server);
let rooms = { Main: { users: [], messages: [], password: null, owner: "server", blackList: [], color: null} };  // Initialize with a "Main" room
let socketToUsername = {}; // A map to store usernames by socket ID



io.sockets.on("connection", function (socket) {
    // Store a default username or the one provided by the client
    let username = `User${socket.id.substr(0, 5)}`;  // Default username
    socketToUsername[socket.id] = username; // Store username for the socket

    socket.join("Main");
    rooms["Main"].users.push(socket.id);    // Track user in the "Main" room

    io.sockets.emit("room_list", Object.keys(rooms).map(room => ({
        name: room,
        isPrivate: rooms[room].password !== null, // true if private, false if public
        host: rooms[room].owner,
        blackList: rooms[room].blackList || [],  // Include blackList, defaulting to an empty array if undefined
        color: rooms[room].color
    })));
    socket.emit("message_to_client", { username: "System", message: "Welcome to the Main room!" }); // Emit the current room info to the client

    socket.prevRoom = null; // Start tracking the previous room, initializing with `null`
    // Listen for the 'set_username' event to update the username
    socket.on('set_username', function (data) {
        username = data.username || username; // If provided, update the username
        socketToUsername[socket.id] = username; // Update stored username
        console.log(`${socket.id} set username to ${username}`);
        //socket.emit("message_to_client", { username: "System", message: `Username set to ${username}` });
        //rooms["Main"].messages.push({ username: "System", message: `Username set to ${username}` });
    });

    socket.on('kick_user', function(info) {
        const otherUser = info.toUser;
        const roomName = info.room;
    
        // Find the socket ID for the user to be kicked
        const userSocketId = Object.keys(socketToUsername).find(id => socketToUsername[id] === otherUser);
        
        if (userSocketId && rooms[roomName]) {
            // Remove the user from the room's user list
            rooms[roomName].users = rooms[roomName].users.filter(id => id !== userSocketId);
    
            // Notify the kicked user
            io.to(userSocketId).emit("kicked", { message: "You have been kicked from the room." });
            
            // Notify other users in the room
            io.to(roomName).emit("message_to_client", {
                username: 'System',
                message: `${otherUser} has been kicked from the room.`
            });
    
            // Make the kicked user leave the room
            io.sockets.sockets.get(userSocketId).leave(roomName);
        } 
        else {
            console.log("User or room not found");
        }
    });

    socket.on('ban_user', function(info) {
        const otherUser = info.toUser;
        const roomName = info.room;
    
        // Find the socket ID of the user to ban
        const userSocketId = Object.keys(socketToUsername).find(id => socketToUsername[id] === otherUser);
    
        if (userSocketId && rooms[roomName]) {
            // Add user to the blacklist for the room
            if (!rooms[roomName].blackList) {
                rooms[roomName].blackList = [];
            }
            rooms[roomName].blackList.push(otherUser);
    
            // Remove the user from the room's user list
            rooms[roomName].users = rooms[roomName].users.filter(id => id !== userSocketId);
    
            // Notify the banned user and emit "kicked" event
            io.to(userSocketId).emit("kicked", { message: "You have been banned from the room. You will be moved to the Main room." });
            io.to(userSocketId).emit("banned", { message: "You have been permanently banned from this room." });
    
            // Notify the room about the ban
            io.to(roomName).emit("message_to_client", {
                username: "System",
                message: `${otherUser} has been banned from the room.`
            });
    
            // Make the banned user leave the room
            io.sockets.sockets.get(userSocketId).leave(roomName);
        } else {
            console.log("User or room not found");
        }
    });

    socket.on("direct_message", (data) => {
        const { fromUser, toUser, message } = data;
        if (message && message.trim() !== "") {
            const senderSocket = Object.keys(socketToUsername).find((id) => socketToUsername[id] === fromUser);
            const recipientSocket = Object.keys(socketToUsername).find((id) => socketToUsername[id] === toUser);

            if (recipientSocket) {
                console.log(`sending DM from ${fromUser} to ${toUser}: ${message}`);
                io.to(recipientSocket).emit("message_to_client", {username: `DM from ${socketToUsername[senderSocket]}`, message, isDirectMessage: true});
                io.to(senderSocket).emit("message_to_client", {username: `DM to ${socketToUsername[recipientSocket]}`, message, isDirectMessage: true});
            }
        }
        else {
            console.log("Empty message received, not sending.");
        }
    });


    socket.on("set_color", function(data) {
        const { name, color } = data;
        
        if (rooms[name]) {
            rooms[name].color = color;  // Set the room's color to the specified color
            io.sockets.emit("room_list", Object.keys(rooms).map(room => ({
                name: room,
                isPrivate: rooms[room].password !== null,
                host: rooms[room].owner,
                blackList: rooms[room].blackList || [],
                color: rooms[room].color
            })));
            io.to(name).emit("message_to_client", {
                username: "System",
                message: `The room color has been changed to ${color}.`
            });
        } 
        else {
            console.log(`Room "${name}" does not exist.`);
        }
    });

    socket.on("get_color", function(name){
        const roomName = name;
        if(rooms[roomName]){
            // Assuming rooms[roomName] has a color property
            const roomColor = rooms[roomName].color;
    
            // Send the color back to the client
            socket.emit("receive_color", roomColor);
        } 
        else {
            // Handle case when room doesn't exist
            socket.emit("receive_color", null); 
        }
    });
    
    

    // Listen for the 'join_room' event to add user to a room
    socket.on('join_room', function(data) {
        const roomToJoin = data.currentRoom;
        console.log(`in join_room function to join ${roomToJoin}`);
        if (rooms[roomToJoin]) {
            if (socket.prevRoom) {
                socket.leave(socket.prevRoom);
                rooms[socket.prevRoom].users = rooms[socket.prevRoom].users.filter(id => id !== socket.id)    // replace the users array for the previous room with an new array that no longer includes the current user
                io.to(socket.prevRoom).emit("update_user_list", rooms[socket.prevRoom].users.map(id => socketToUsername[id]));    // update the list of users for the previous room with the list of usernames (not the socket.ids)

                io.to(socket.prevRoom).emit("message_to_client", {username: 'System', message: `${socketToUsername[socket.id]} has left the room.`})      // Notify the previous room about the user leaving
                rooms[socket.prevRoom].messages.push({ username: "System", message: `${socketToUsername[socket.id]} has left the room.` });

                console.log(`User ${socket.id} left room: ${socket.prevRoom}`);
            }

            socket.join(roomToJoin);        // adds the socket (connected user) to the specified roomToJoin on the server-side
            socket.prevRoom = roomToJoin;   // set as new previous room for when the user wants to go to another room after this one

            // Add the user to the current room's user list if they're not already there
            if (!rooms[roomToJoin].users.includes(socket.id)) {
                rooms[roomToJoin].users.push(socket.id);
            }

            //io.to(roomToJoin).emit("message_to_client", {username: 'System', message: `${socketToUsername[socket.id]} has joined the room.`})
            rooms[roomToJoin].messages.push({ username: "System", message: `${socketToUsername[socket.id]} has joined the room.` });
            console.log(`joined room: ${roomToJoin}`);

            // Send the list of usernames instead of socket IDs
            const usernamesInRoom = rooms[roomToJoin].users.map(socketId => socketToUsername[socketId]);
            io.to(roomToJoin).emit('update_user_list', usernamesInRoom);    // Emit the updated list of users in the room

            // Emit the room list to the client
            io.sockets.emit("room_list", Object.keys(rooms).map(room => ({
                name: room,
                isPrivate: rooms[room].password !== null, // true if private, false if public
                host: rooms[room].owner,
                blackList: rooms[room].blackList || [],  // Include blackList, defaulting to an empty array if undefined
                color: rooms[room].color
            })));

            // Send the room-specific message history to the user
            rooms[roomToJoin].messages.forEach((msg) => {
                io.to(socket.id).emit("message_to_client", { username: msg.username, message: msg.message, room: roomToJoin });
            });

            console.log(`User ${socket.id} joined room: ${roomToJoin}`);
        }
        else {
            console.log(`Room ${roomToJoin} does not exist`);
        }
        
    });

    socket.on("check_password", function(data) {
        const room = data.room;
        const passwordEntered = data.password;
    
        // Check if the room exists in the rooms object
        if (rooms[room]) {
            // Iterate through the rooms to check if the room has a password and if it matches
            const isPasswordCorrect = rooms[room].password === passwordEntered;
    
            if (isPasswordCorrect) {
                // If the password is correct, allow the user to join the room
                socket.emit("password_check_result", { success: true });
            } 
            else {
                // If the password is incorrect
                socket.emit("password_check_result", { success: false });
            }
        } 
        else {
            // If the room does not exist, return false
            socket.emit("password_check_result", { success: false });
        }
    });

    // Listen for a new message and emit only to users in the specific room
    socket.on("message_to_server", function (data) {
        const { username, message, currentRoom } = data;
        if (rooms[currentRoom]) {
            rooms[currentRoom].messages.push({ username, message });
            io.to(currentRoom).emit("message_to_client", { username, message, room: currentRoom });
        } else {
            console.log(`Room "${currentRoom}" does not exist.`);
        }
    });


    socket.on('create', function(room) {
        const roomName = room["rN"];
        const access = room["privacy"];
        const pass = room["password"];
        const host = room["owner"];
        const color = room["color"];

        console.log('Create room: ' + roomName + 'with privacy: ' + access + 'password: ' + pass);
        
        if (!rooms[roomName]) {         // if this room does not already exist
            rooms[roomName] = { users: [], messages: [], password: access === "private" ? pass : null, owner: host, color: color};  // Initialize with users and messages and password if applicable 
            socket.join(roomName);  // Add user to the room
            rooms[roomName].users.push(socket.id);  // Track user in the room
            io.sockets.emit("room_list", Object.keys(rooms).map(room => ({
                name: room,
                isPrivate: rooms[room].password !== null, // true if private, false if public
                host: rooms[room].owner,
                blackList: rooms[room].blackList || [],  // Include blackList, defaulting to an empty array if undefined
                color: rooms[room].color
            })));
            io.to(roomName).emit("message_to_client", { username: "System", message: `New room has been created ~ ${roomName}` });
        } 
        else {
            io.sockets.emit("message_to_client", { username: "System", message: `${roomName} already exists.` });
        }
    });


    // Handle user disconnect
    socket.on('disconnect', function() {
        console.log(`User ${socket.id} disconnected`);

        // Remove the user from any room they're in
        if (socket.prevRoom) {
            const prevRoom = socket.prevRoom;
            rooms[prevRoom].users = rooms[prevRoom].users.filter(id => id !== socket.id);

            // Emit updated user list to the room
            const usernamesInRoom = rooms[prevRoom].users.map(id => socketToUsername[id]);
            io.to(prevRoom).emit('update_user_list', usernamesInRoom);

            // Notify the room about the user leaving
            rooms[prevRoom].messages.push({ username: 'System', message: `${socketToUsername[socket.id]} has disconnected.` });
            io.to(prevRoom).emit("message_to_client", { username: 'System', message: `${socketToUsername[socket.id]} has disconnected.` });
        }
    });
    
});
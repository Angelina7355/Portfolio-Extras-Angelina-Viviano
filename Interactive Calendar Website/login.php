<?php
require 'database.php'; 

session_start();

// Function to send JSON responses
function sendResponse($success, $message) {
    header("Content-Type: application/json");
    echo json_encode(array("success" => $success, "message" => $message));
    exit;
}


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action'])) {

        if ($_POST['action'] === 'Login') {    // If we are attempting to login
            if (isset($_POST['username']) && isset($_POST['password'])) {
                $username = $_POST['username'];
                $password = $_POST['password'];

                // Check the connection
                if ($mysqli->connect_errno) {
                    sendResponse(false, "Connection Failed: " . $mysqli->connect_error);
                }

                // Prepare and execute the SQL query
                $stmt = $mysqli->prepare("SELECT COUNT(*), password FROM accounts WHERE username=?");
                if (!$stmt) {
                    sendResponse(false, "Query Prep Failed: " . $mysqli->error);
                }

                $stmt->bind_param('s', $username);
                $stmt->execute();
                $stmt->bind_result($cnt, $hashedPassword);
                $stmt->fetch();

                // Verify password and check for user existence
                if ($cnt == 1 && password_verify($password, $hashedPassword)) {
                    $_SESSION['username'] = $username;
                    $_SESSION['signedIn'] = true;
                    $_SESSION['token'] = bin2hex(openssl_random_pseudo_bytes(32)); 
                    sendResponse(true, "Login successful");
                } else {
                    sendResponse(false, "Incorrect Username or Password");
                }
                $stmt->close();
            } else {
                sendResponse(false, "Username and Password are required");
            }
        }


        elseif ($_POST['action'] === 'Create account') { // If we are attempting to make an account
            if (isset($_POST['newUsername']) && isset($_POST['newPassword'])) {
                $newUsername = $_POST['newUsername'];
                $newPassword = $_POST['newPassword'];
        
                // Check for empty input
                if (empty($newUsername) || empty($newPassword)) {
                    sendResponse(false, "Please provide a username and password.");
                }
        
                // Check the connection
                if ($mysqli->connect_errno) {
                    sendResponse(false, "Connection Failed: " . $mysqli->connect_error);
                }
        
                // Prepare and execute the SQL query to insert new account
                $stmt = $mysqli->prepare("INSERT INTO accounts (username, password) VALUES (?, ?)");
                if (!$stmt) {
                    sendResponse(false, "Query Prep Failed: " . $mysqli->error);
                }
        
                // Hash the password
                $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
                $stmt->bind_param('ss', $newUsername, $hashedPassword);
                
                // Execute the statement and check for errors
                if (!$stmt->execute()) {
                    // Check for duplicate entry error (error code 1062)
                    if ($stmt->errno == 1062) {
                        $stmt->close();
                        sendResponse(false, "This username is already taken. Please choose another one.");
                    } else {
                        // Log any other error
                        sendResponse(false, "Error executing query: " . $stmt->error);
                    }
                } 
                else {
                    $stmt->close();
                    $_SESSION['username'] = $newUsername;
                    $_SESSION['signedIn'] = true;
                    $_SESSION['token'] = bin2hex(openssl_random_pseudo_bytes(32)); 
                    sendResponse(true, "Account created successfully");
                }
            } else {
                sendResponse(false, "Username and Password are required");
            }
        }
        
    }
}

// If the request method is not POST, send an error response
sendResponse(false, "Invalid Request Method");
?>

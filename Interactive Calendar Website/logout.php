<?php
require 'database.php'; 

session_start();

// Function to send JSON responses
function sendResponse($success, $message) {
    header("Content-Type: application/json");
    echo json_encode(array("success" => $success, "message" => $message));
    exit;
}



if ($_SERVER['REQUEST_METHOD'] === 'POST') { // Logs out by destroying session and sending success message
    $_SESSION['signedIn'] = false;
    session_destroy();
    sendResponse(true, "Logout Successful");
}

// If the request method is not POST, send an error response
sendResponse(false, "Invalid Request Method");
?>

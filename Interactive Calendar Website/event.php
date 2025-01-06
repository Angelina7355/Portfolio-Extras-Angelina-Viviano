<?php

session_start();
require 'database.php';

function sendResponse($success, $message) { // Function that sends whether or not promise was completed or not with possible error message
    header("Content-Type: application/json");
    echo json_encode(array("success" => $success, "message" => $message));
    exit;
}

function sendData($events) { // Function that sends requested information
    header("Content-Type: application/json");
    echo json_encode($events);
    exit; 
}

$input = json_decode(file_get_contents('php://input'), true); // Checks the php input logs to assign variables
$user = $_SESSION['username']; 
$title = $input['title'] ?? ""; // Variables are empty if not inputted
$time = $input['time'] ?? null;
$day = $input['day'] ?? null;
$month = $input['month'] ?? null;
$year = $input['year'] ?? null;
$event = $input['event_id'] ?? null;
$tag = $input['tag'] ?? "none";

if ($_SERVER['REQUEST_METHOD'] === 'POST') { // Code if we want to create, edit, or delete events


    if (empty($title) || empty($time) || empty($day) || empty($month) || empty($year)) { // checks that the input are not empty
        if((empty($event) && empty($day))){                                 // If both are empty then user attemped to make a post but did not include all parameters

            sendResponse(false, "Title, time, day, month, and year cannot be empty! Make sure the day or month number exists.");
        }
        else { // deleting an event
            // Prepare and execute the delete statement
            $stmt = $mysqli->prepare("DELETE FROM events WHERE event_id = ?");
            
            if (!$stmt) {
                sendResponse(false, "Query Prep Failed: " . $mysqli->error);
                return; // Exit early if the preparation fails
            }
            // Bind parameters
            $stmt->bind_param('i', $event);
            
            // Execute the statement
            if (!$stmt->execute()) {
                sendResponse(false, "Execution Failed: " . $stmt->error);
                return; // Exit if execution fails
            }
        
            // Check how many rows were affected
            if ($stmt->affected_rows > 0) {
                sendResponse(true, "Event Deleted!"); // Successfully deleted the event
            } else {
                sendResponse(false, "Either Time or Day/Month doesn't exist."); // No rows affected
            }
            
            $stmt->close();
        }
        

    }

    if (!preg_match("/^\d{2}:\d{2}$/", $time)) {
        sendResponse(false, "Time must be in HH:MM format!"); // Corrects the format
    } 

    if ($event) { // Update event
        $stmt = $mysqli->prepare("UPDATE events SET title = ?, time = ?, day = ?, month = ?, year = ?, tag = ? WHERE event_id = ?"); //SQL query
        if (!$stmt) {
            sendResponse(false, "Query Prep Failed: ". $mysqli->error);
        }
        $stmt->bind_param('ssiiisi', $title, $time, $day, $month, $year, $tag, $event);
        $stmt->execute();
        $stmt->close();
        sendResponse(true, "Event updated!"); // Successfully updated event

    } 
    else { // Create new event
        $stmt = $mysqli->prepare("INSERT INTO events (username, title, time, day, month, year, tag) VALUES (?, ?, ?, ?, ?, ?, ?)");
        if (!$stmt) {
            sendResponse(false, "Query Prep Failed: ". $mysqli->error);
        }
        $stmt->bind_param('sssiiis', $user, $title, $time, $day, $month, $year, $tag);
        $stmt->execute();
        $stmt->close();
        sendResponse(true, "Event made!"); // Successfully created an event 
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') { // This is code to obtain all existing events to show on calender or find existing event
    $month = $_GET['month'] ?? null; // Empty if the parameters are not passed correctly
    $year = $_GET['year'] ?? null;
    $day = $_GET['day'] ?? null;
    $title = $_GET['title'] ?? null;

    if(!empty($title)){ // This is to search for an event 
        $stmt = $mysqli->prepare("SELECT month, day FROM events WHERE title = ? AND username = ? ORDER BY month ASC, day ASC");
        if (!$stmt) {
            sendResponse(false, "Query Prep Failed: " . $mysqli->error);
        }

        $stmt->bind_param('ss', $title, $user);
        $stmt->execute();
        $result = $stmt->get_result(); // Stores as array
        
        $events = [];
        while ($row = $result->fetch_assoc()) { //puts each inputas in one row 
            $events[] = $row;
        }
        $stmt->close();

        sendData($events);
    }

    if (empty($month) || empty($year) || empty($day)) { // This is to get all events for each day
        sendResponse(false, "Day, Month, and year parameters are required.");
    }
    // SQL querry to get the events in the current month (time,day,event_id), by day and time ascending order
    $stmt = $mysqli->prepare("SELECT title, time, day, month, year, event_id, tag FROM events WHERE day = ? AND month = ? AND year = ? AND username = ? ORDER BY day ASC, time ASC");
    if (!$stmt) {
        sendResponse(false, "Query Prep Failed: " . $mysqli->error);
    }

    $stmt->bind_param('iiis', $day, $month, $year, $user);
    $stmt->execute();
    $result = $stmt->get_result(); // Stores as array
    
    $events = [];
    while ($row = $result->fetch_assoc()) { //puts each inputas in one row 
        $events[] = $row;
    }
    $stmt->close();

    sendData($events);
}
?>

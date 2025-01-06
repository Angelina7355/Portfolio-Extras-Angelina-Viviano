<?php
require 'database.php';
session_start();
    
    if(!isset($_SESSION['signedIn'])){ // makes sure user has access to the home screen before running the code
        header("Location: login.html");
    }
    
    $name = $_SESSION['username'];
    $post = $_POST['post_id'];

    $stmt = $mysqli->prepare("delete from comments where post_id = ? "); // Because comments have foreign keys to post, comments must be deleted first
    if (!$stmt) {
        printf("Query Prep Failed: %s\n", $mysqli->error);
        exit;
    }

    else{
        $stmt->bind_param('i', $post);  // 'i' for integer, 's' for string (username)
        $stmt->execute();
        $stmt->close();
    
        $stmt = $mysqli->prepare("delete from posts where post_id = ? ");
        if (!$stmt) {
            printf("Query Prep Failed: %s\n", $mysqli->error);
            exit;
        }
    
        $stmt->bind_param('i', $post);  // 'i' for integer, 's' for string (username)
        $stmt->execute();
        $stmt->close();
        header("Location: home_page.php");  // Redirect back to the home page
        exit;
    }



?>
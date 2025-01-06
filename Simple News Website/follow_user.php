<?php
require 'database.php';
session_start();
    
    if(!isset($_SESSION['signedIn'])){ // makes sure user has access to the home screen before running the code
        header("Location: login.html");
    }
    
    $name = $_SESSION['username'];

    if (!empty($_POST['followed_user'])){
        $followed_user = $_POST['followed_user'];
        $stmt = $mysqli->prepare("insert into followers (follower, username) values (?, ?) "); // Because comments have foreign keys to post, comments must be deleted first
        if (!$stmt) {
            printf("Query Prep Failed: %s\n", $mysqli->error);
            exit;
        }
    
        else{
            $stmt->bind_param('ss', $name, $followed_user);  // 'i' for integer, 's' for string (username)
            $stmt->execute();
            $stmt->close();
            header("Location: home_page.php");  // Redirect back to the home page
            exit;
        }
    }
    elseif (!empty($_POST['unfollowed_user'])){
        $unfollowed_user = $_POST['unfollowed_user'];
        $stmt = $mysqli->prepare("delete from followers where follower = ? and username = ? "); // Because comments have foreign keys to post, comments must be deleted first
        if (!$stmt) {
            printf("Query Prep Failed: %s\n", $mysqli->error);
            exit;
        }
        $stmt->bind_param('ss', $name, $unfollowed_user);
        $stmt->execute();
        $stmt->close();
        header("Location: home_page.php");  // Redirect back to the home page
        exit;
    }




?>
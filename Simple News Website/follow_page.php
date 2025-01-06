<!DOCTYPE HTML>
<html lang="en">
<title>News Website Followed Page</title>
<link rel="stylesheet" href="home_page_styleSheet.css"> 
<div class="top-panel"></div> <!-- css class from style sheet to show blue panel at top of screen -->
<div class="container">     <!-- css class from style sheet to define all code in the class as a flex space (conforms to the amount of space not already taken up by other displays) -->
    <div class="sidebar">   <!-- css class to define a sidebar to hold the "make a post" button to keep its space separate from the posts' space -->
        <form action = "home_page.php" method = "POST">     <!-- return to home page once user posts their comment -->
            <p>
                <button type = "submit" class = "alpha-button">Return to<br>Homepage</button>
            </p>
        </form>
    </div>

    <div class="main-content">
<h1>Users You Are Following (You Creep)</h1>
<?php
    require 'database.php';
    if($mysqli->connect_errno) {
	    printf("Connection Failed: %s\n", $mysqli->connect_error);
	    exit;
    }
    session_start();

        if(!isset($_SESSION['signedIn'])){ // makes sure user has access to the home screen before running the code
            header("Location: login.html");
        }
        if (isset($_SESSION['username'])) {   // runs code if user has logged in with their username
            $name = $_SESSION['username'];   

            // runs sql query to retreive infromation from the title, body, username, date_and_time, and post_id columns in the post table
            //$stmt = $mysqli->prepare("select title, body, username, date_and_time, post_id from posts order by date_and_time DESC");
            $stmt = $mysqli->prepare("SELECT p.title, 
                                             p.body, 
                                             p.username, 
                                             p.date_and_time AS post_date_time, 
                                             p.post_id,
                                             p.link, 
                                             c.username, 
                                             c.comment, 
                                             c.date_and_time AS comment_date_time,
                                             c.comment_id
                                             FROM posts p
                                             LEFT JOIN comments c on p.post_id = c.post_id
                                             INNER JOIN followers f ON f.username = p.username
                                             WHERE f.follower = ? 
                                             ORDER BY post_date_time DESC, comment_date_time DESC");
            if(!$stmt){
	            printf("Query Prep Failed: %s\n", $mysqli->error);
	            exit;
            }
            $stmt->bind_param('s', $name);
            $stmt->execute();

            $stmt->bind_result($pTitle, $pBody, $pUser, $pTimestamp, $post_id, $link, $cUser, $comment, $cTimestamp, $comment_id); // takes results from query and loads them into their corresponding variables

            $prevPostID = null;
            // shows all posts from the posts table in mySQL
            while($stmt->fetch()){      // while stmt->fetch() is not null / storing a value in the variables specified in $stmt->bind_result($title, $body, $user, $timestamp, $post_id)
                if($post_id !== $prevPostID) {
                    echo "<div class='post-separator'></div>\n";  // Custom separator
                    echo "<article class='post'>\n";
                    echo "<h2>" . htmlspecialchars($pTitle) . "</h2>\n";  // Display the post title as a heading
                    echo "<h5>Posted by " . nl2br(htmlspecialchars($pUser)) . " at " . nl2br(htmlspecialchars($pTimestamp)) . "</h5>";    // display the user who posted and the timestamp for when they did it
                    echo "<p>" . nl2br(htmlspecialchars($pBody)) . "</p>\n";  // Display the body with line breaks

                    if ((!empty($link)) && (trim($link) !== '')) {
                        echo "<p>Associated Link: <a href=" . nl2br(htmlspecialchars($link)) . ">Click Here</a></p>\n"; 
                    }

                    echo "<form action='comments.php' method='POST'>\n";
                    echo "<input type='hidden' name='post_id' value='" . htmlspecialchars($post_id) . "'>\n";
                    echo "<button type='submit' class='beta-button'>Leave a comment</button>\n";
                    echo "</form>\n";

                    echo "</article>\n";
                }

                if (!empty($comment)) {
                    echo "<article class='comment'>\n";
                    echo "<p>" . nl2br(htmlspecialchars($comment)) . "</p>\n";  // Display the body with line breaks
                    echo "<h6>Posted by " . nl2br(htmlspecialchars($cUser)) . " at " . nl2br(htmlspecialchars($cTimestamp)) . "</h6>";    // display the user who posted and the timestamp for when they did it

                    if($name === $cUser){
                        echo "<div class='button-container'>\n";    // div class to put all buttons on a comment beside each oter

                        echo "<form action='comments.php' method='POST'>\n";  // Send to edit comment 
                        echo "<input type='hidden' name='post_id' value='" . htmlspecialchars($post_id) . "'>\n";
                        echo "<input type='hidden' name='comment_id' value='" . htmlspecialchars($comment_id) . "'>\n"; // Send the comment_id for editing
                        echo "<button type='submit' class='beta-button2'>Edit comment</button>\n";
                        echo "</form>\n";

                        echo "<form action='delete_comment.php' method='POST'>\n";
                        echo "<input type='hidden' name='comment_id' value='" . htmlspecialchars($comment_id) . "'>\n"; // Send the comment_id for deletion
                        echo "<button type='submit' class='beta-button2'>Delete comment</button>\n";
                        echo "</form>\n";

                        echo "</div>\n";


                    }
                    echo "</article>\n";
                }
                
                echo "</article>\n";
                $prevPostID = $post_id;
            }

            $stmt->close();
        }

        ?>


        </div>

    </div> 
</body>

</html>
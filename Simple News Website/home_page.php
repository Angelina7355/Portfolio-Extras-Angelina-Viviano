<!DOCTYPE HTML>
<html lang="en">

<head>
    <title>News Website Home Page</title>
    <link rel="stylesheet" href="home_page_styleSheet.css">     <!-- makes this page use the formatting specificed in the home page style sheet -->
</head>

<body>
    <div class="top-panel"></div> <!-- css class from style sheet to show blue panel at top of screen -->

    <div class="container">     <!-- css class from style sheet to define all code in the class as a flex space (conforms to the amount of space not already taken up by other displays) -->

        <div class="sidebar">   <!-- css class to define a sidebar to hold the "make a post" button to keep its space separate from the posts' space -->

            <form action = "post.php" method = "POST">
                <p>
                    <!-- Create make a post button -->
                    <input type = "submit" value = "Make a Post" class="alpha-button"/>  <!-- uses the post-botton class in the style sheet so button looks nicer -->
                </p>
            </form>

            <form action = "follow_page" method = "POST">
                <p>
                    <!-- Create show followed posts only button -->
                    <input type = "submit" name = "show_followed" value = "Following Posts" class="alpha-button"/>
                </p>
            </form>

            <form action = "" method = "POST">
                <p>
                    <!-- Create logout button -->
                    <input type = "submit" name = "logout" value = "Logout" class="alpha-button"/>
                </p>
            </form>

        </div>
        
        <div class="main-content">  <!-- css class describing the main content (so that all of the following visuals fill up the space not taken up by the sidebar) -->

        <h1>Generic News Website</h1>
        <p>Here, you'll find the most relevant news so you can gasslight yourself into thinking you're the main character.</p>
       <?php
        require 'database.php';
        session_start();

        if(!isset($_SESSION['signedIn'])){ // makes sure user has access to the home screen before running the code
            header("Location: login.html");
        }
        
        // if(!hash_equals($_SESSION['token'], $_POST['token'])){  // check for attacks (if so, token from login would change)
        //     die("Request forgery detected");
        // }

        if (isset($_SESSION['username'])) {   // runs code if user has logged in with their username
            $name = $_SESSION['username'];
            printf("<h3>Welcome, %s!</h3>", $name);      // prints a customized welcome message to the user

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
                                            c.comment_id,
                                            case when f.follower is not null then 1
                                            else 0
                                            end as is_followed
                                            FROM posts p
                                            LEFT JOIN comments c on p.post_id = c.post_id
                                            LEFT JOIN followers f ON f.username = p.username and f.follower = ?
                                            ORDER BY post_date_time DESC, comment_date_time ASC");
            if(!$stmt){
	            printf("Query Prep Failed: %s\n", $mysqli->error);
	            exit;
            }

            $stmt->bind_param('s', $name);

            $stmt->execute();

            $stmt->bind_result($pTitle, $pBody, $pUser, $pTimestamp, $post_id, $link, $cUser, $comment, $cTimestamp, $comment_id, $follows); // takes results from query and loads them into their corresponding variables

            $prevPostID = null;
            // shows all posts from the posts table in mySQL
            while($stmt->fetch()){      // while stmt->fetch() is not null / storing a value in the variables specified in $stmt->bind_result($title, $body, $user, $timestamp, $post_id)
                if($post_id !== $prevPostID) {      // makes sure a post is only shown once when it has multiple comments
                    echo "<div class='post-separator'></div>\n";  // Custom separator
                    echo "<article class='post'>\n";
                    echo "<h2>" . htmlspecialchars($pTitle) . "</h2>\n";  // Display the post title as a heading
                    echo "<h5>Posted by " . nl2br(htmlspecialchars($pUser)) . " at " . nl2br(htmlspecialchars($pTimestamp)) . "</h5>";    // display the user who posted and the timestamp for when they did it
                    echo "<p>" . nl2br(htmlspecialchars($pBody)) . "</p>\n";  // Display the body with line breaks
                    if (!empty($link)) {
                        echo "<p>Associated Link: <a href=" . nl2br(htmlspecialchars($link)) . ">Click Here</a></p>\n"; 
                    }

                    echo "<div class='button-container'>\n";    // div class to put all buttons on a post beside each other
                    if ($pUser !== $name){
                        if (!($follows)) {
                            echo "<form action='follow_user.php' method='POST'>\n";
                            echo "<input type='hidden' name='followed_user' value='" . htmlspecialchars($pUser) . "'>\n";
                            echo "<button type='submit' class='beta-button'>Follow " . htmlspecialchars($pUser) . "</button>\n";
                            echo "</form>\n";
                        }
                        else{
                            echo "<form action='follow_user.php' method='POST'>\n";
                            echo "<input type='hidden' name='unfollowed_user' value='" . htmlspecialchars($pUser) . "'>\n";
                            echo "<button type='submit' class='beta-button'>Unfollow " . htmlspecialchars($pUser) . "</button>\n";
                            echo "</form>\n";
                        }
                    }
                    // button to leave a comment
                    echo "<form action='comments.php' method='POST'>\n";
                    echo "<input type='hidden' name='post_id' value='" . htmlspecialchars($post_id) . "'>\n";
                    echo "<button type='submit' class='beta-button'>Leave a comment</button>\n";
                    echo "</form>\n";

                    if ($name === $pUser) {
                        // If the usernames match, display the delete button
                        echo "<form action='delete_post.php' method='POST'>\n";
                        echo "<input type='hidden' name='post_id' value='" . htmlspecialchars($post_id) . "'>\n"; // Send the post_id for deletion
                        echo "<button type='submit' class='beta-button'>Delete Post</button>\n";
                        echo "</form>\n";
    
                        // If the usernames match, display the edit button
                        echo "<form action='post.php' method='POST'>\n";
                        echo "<input type='hidden' name='post_id' value='" . htmlspecialchars($post_id) . "' class='beta-button'>\n"; // Send the post_id for editing
                        echo "<button type='submit' class='beta-button'>Edit Post</button>\n";
                        echo "</form>\n";
                    }
                    echo "</div>\n";
                    echo "</article>\n";
                }

                if (!empty($comment)) {
                    echo "<article class='comment'>\n";
                    echo "<p>" . nl2br(htmlspecialchars($comment)) . "</p>\n";  // Display the body with line breaks
                    echo "<h6>Posted by " . nl2br(htmlspecialchars($cUser)) . " at " . nl2br(htmlspecialchars($cTimestamp)) . "</h6>";    // display the user who posted and the timestamp for when they did it
                    if($name === $cUser){
                        echo "<div class='button-container'>\n";    // div class to put all buttons in this comment beside each oter
                        
                        echo "<form action='comments.php' method='POST'>\n";
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

    if (isset($_POST["logout"])) {  // destroys user's session variables upon logout and returns to login screen
        $_SESSION['signedIn'] = false;
        session_destroy();
        header("Location: login.php");
        exit;
    }
    ?>
        </div>

    </div> 
</body>

</html>
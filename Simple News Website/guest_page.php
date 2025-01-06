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
            <form action = "login.php" method = "POST">
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
            printf("<h3>Welcome, Guest!</h3>");      // prints a customized welcome message to the user

            // runs sql query to retreive infromation from the title, body, username, date_and_time, and post_id columns in the post table

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
                                            ORDER BY post_date_time DESC, comment_date_time ASC");
            if(!$stmt){
	            printf("Query Prep Failed: %s\n", $mysqli->error);
	            exit;
            }


            $stmt->execute();

            $stmt->bind_result($pTitle, $pBody, $pUser, $pTimestamp, $post_id, $link, $cUser, $comment, $cTimestamp, $comment_id); // takes results from query and loads them into their corresponding variables

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

                if (!empty($comment)) {
                    echo "<article class='comment'>\n";
                    echo "<p>" . nl2br(htmlspecialchars($comment)) . "</p>\n";  // Display the body with line breaks
                    echo "<h6>Posted by " . nl2br(htmlspecialchars($cUser)) . " at " . nl2br(htmlspecialchars($cTimestamp)) . "</h6>";    // display the user who posted and the timestamp for when they did it
                    echo "</article>\n";
                    }
                }

                echo "</article>\n";
                $prevPostID = $post_id;
            }

            $stmt->close();


    if (isset($_POST["logout"])) {  // Back to login
        header("Location: login.html");
        exit;
    }
    ?>
        </div>

    </div> 
</body>

</html>
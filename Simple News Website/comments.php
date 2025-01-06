<!DOCTYPE html>
<html lang="en">

<head>
    <title>Make a comment</title>
    <link rel="stylesheet" href="home_page_styleSheet.css">
</head>

<body>


<?php

session_start();
if(!isset($_SESSION['signedIn'])){ // makes sure user has access to the comment screen before running the code
    header("Location: login.html");
}

require 'database.php';

if (isset($_SESSION['username'])) {
    $post_id = $_POST['post_id'];
    $stmt = $mysqli->prepare("select title, body, username, date_and_time from posts where post_id=?");
    if(!$stmt){
        printf("Query Prep Failed: %s\n", $mysqli->error);
        exit;
    }

    $stmt->bind_param('i', $post_id); // inputs $name for username in SQL command
    $stmt->execute();

    $stmt->bind_result($title, $body, $user, $timestamp);
    $stmt->fetch();

    // display the whole post that the user wants to comment on
    echo "<article class='post'>\n";
    echo "<h2>" . htmlspecialchars($title) . "</h2>\n";  // Display the post title as a heading
    echo "<h5>Posted by " . nl2br(htmlspecialchars($user)) . " at " . nl2br(htmlspecialchars($timestamp)) . "</h5>";
    echo "<p>" . nl2br(htmlspecialchars($body)) . "</p>\n";  // Display the body with line breaks
    echo "</article>\n";
    $stmt->close();

    $comment_id = null;
    $existing_comment = "";

    if (isset($_POST['comment_id'])) {  // Grabs text from an existing comment
        echo("Edit your comment:");
        $comment_id = $_POST['comment_id'];
        $stmt = $mysqli->prepare("select comment from comments where comment_id = ?");  // Grab the existing entries
        if(!$stmt){
            printf("Query Prep Failed: %s\n", $mysqli->error);
            exit;
        }
        $stmt->bind_param('i', $comment_id);
        $stmt->execute();
        $stmt->bind_result($existing_comment); // The grabbed information is stored
        $stmt->fetch();
        $stmt->close();
    }


}
?>

<form name = "comment" action = "" method = "POST"> <!-- button for user who wants to leave a comment -->


        <p>
            <label for ="commentInput">Write comment here:</label>  <!-- textbox for user to write a comment -->
            <textarea id="bigTextBox" name="commentBody"><?php echo htmlspecialchars($existing_comment); ?></textarea>
        </p>
        

        <p>
            <input type = "submit" value = "Comment" /> <!-- button to submit the comment -->

        </p>


        <input type="hidden" name="post_id" value="<?php echo htmlspecialchars($post_id); ?>"> 
        <input type="hidden" name="comment_id" value="<?php echo htmlspecialchars($comment_id); ?>"> 
        <!-- Allows the varible post_id to be transfered -->

    </form>
<?php

if(isset($_POST['commentBody'])){
    if (!empty($_POST['commentBody'])) {
        $user = $_SESSION['username'];
        $comment = $_POST['commentBody'];
        $post_id = $_POST['post_id'];


        if (!empty($_POST['comment_id'])) { // Edit an existing comment 
            $comment_id = $_POST['comment_id'];
            $stmt = $mysqli->prepare("update comments set comment = ? where comment_id = ?"); // update entry code in SQL
            if (!$stmt) {
                printf("Query Prep Failed: %s\n", $mysqli->error);
                exit;
            }
            $stmt->bind_param('si', $comment, $comment_id);  // Bind title, body, link, and post_id
            $stmt->execute();
            $stmt->close();
            header('Location: home_page.php');
        }
        else{ // Make a new one
            $stmt = $mysqli->prepare("insert into comments (username, post_id, comment) values (?, ?, ?)"); // SQL code  where ? are inputs 
            if(!$stmt){
                printf("Query Prep Failed: %s\n", $mysqli->error);
                exit;
            }
            $stmt->bind_param('sss', $user, $post_id, $comment); // Input vals ('var types', first input, second input, ...)
            
            $stmt->execute();
            header('Location: home_page.php');
        }

        
    }

    else{
        echo ("comment cannot be empty!");
    }

}

?>

<form action = "home_page.php" method = "POST">     <!-- return to home page once user posts their comment -->
        <p>
            <input type = "submit" value = "Go Back" /> <!-- button to post the comment -->
        </p>
        </form>

</body>
</html>
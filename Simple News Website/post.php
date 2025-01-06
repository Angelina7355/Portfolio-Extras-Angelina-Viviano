<!DOCTYPE HTML>
<html lang="en">
<head><title>Login</title></head>
<body>

<?php
session_start();
if(!isset($_SESSION['signedIn'])){ // Checks if user is still signed in
    header("Location: login.html");
}
require 'database.php';
$user = $_SESSION['username']; 
$title = "";  // These stay empty if the user is making a new post
$story = "";
$link = "";
$post = null;

if (isset($_POST['post_id'])) {  // Editing an existing post
    echo("Edit your post:");
    $post = $_POST['post_id'];
    $stmt = $mysqli->prepare("select title, body, link from posts where post_id = ?");  // Grab the existing entries
    if(!$stmt){
        printf("Query Prep Failed: %s\n", $mysqli->error);
        exit;
    }
    
    $stmt->bind_param('i', $post);
    $stmt->execute();
    $stmt->bind_result($title, $story, $link); // The grabbed information is stored
    $stmt->fetch();
    $stmt->close();
}
else {      // if we're making a new post; not editing an existing one
    echo("Make a new post:");
}

?>

<form name = "publish" action = "" method = "POST">
    <!-- Writes the already existing information into the text box to edit -->
    <input type="hidden" name="post_id" value="<?php echo htmlspecialchars($post); ?>" />

    <p>
        <label for="titleInput">Title:</label>
        <input type="text" name="title" id="titleInput" value="<?php echo htmlspecialchars($title); ?>" />
    </p>

    <p>
        <label for="bodyInput">Body text:</label>
        <textarea id="bigTextBox" name="body"><?php echo htmlspecialchars($story); ?></textarea>
    </p>
        
        <p>
            <label for ="linkInput">Associated links (if applicable):</label>
            <input type = "text" name="link" id = "linkInput">
        </p>


        <p>
            <input type = "submit" value = "Post" />

        </p>

 </form>

<?php
if(isset($_POST['title']) && isset($_POST['body'])){ // This is so it doesn't automatically assume something should be inputted
    if ((empty($_POST['title']) || empty($_POST['body']))) {
        echo ("Title and body cannot be empty!");
    }

    else{ // If text is corectly entered
        $title = $_POST['title'];
        $story = $_POST['body'];
        if($_POST['link'] === ''){
            $link = null;
        }
        else{
            $link = $_POST['link'];
        }

        
        if (!empty($_POST['post_id'])) { // Update post 
            $post_id = $_POST['post_id'];
            $stmt = $mysqli->prepare("update posts set title = ?, body = ?, link = ? where post_id = ?"); // update entry code in SQL
            if (!$stmt) {
                printf("Query Prep Failed: %s\n", $mysqli->error);
                exit;
            }
            $stmt->bind_param('sssi', $title, $story, $link, $post_id);  // Bind title, body, link, and post_id
            $stmt->execute();
            $stmt->close();
            header('Location: home_page.php');
        }
        
        else{        // Make a new post
            $stmt = $mysqli->prepare("insert into posts (username, title, body, link) values (?, ?, ?, ?)"); // SQL code  where ? are inputs 
            if(!$stmt){
                printf("Query Prep Failed: %s\n", $mysqli->error);
                exit;
            }
            $stmt->bind_param('ssss', $user, $title, $story, $link); // Input vals ('var types', first input, second input)
            
            $stmt->execute();
            $stmt->close();
            header('Location: home_page.php');
        }
    }
}

 
?>

<form action = "home_page.php" method = "POST">
        <!-- Simple back button -->
        <p>
            <input type = "submit" value = "Go Back" />
        </p>
</form>    
    
</body>
</html>
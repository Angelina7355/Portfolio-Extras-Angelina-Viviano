<!DOCTYPE HTML>
<html lang="en">
<head><title>Login</title></head>
<body>
    <?php
    require 'database.php';
    if (!($_POST['username'] === "" || $_POST['password'] === "")) { // Checks that the login credentials are not empty
    // Handle the login logic here
    // Check login credentials...
    session_start();

    if (isset($_GET['message'])) { // gives message about login status
        echo htmlspecialchars($_GET['message'])."<br><br>";
    }

    $name = $_POST['username'];
    $pass = $_POST['password'];

    $validUser = false;
    if($mysqli->connect_errno) {
	    printf("Connection Failed: %s\n", $mysqli->connect_error);
	    exit;
    }

    $stmt = $mysqli->prepare("select COUNT(*), password from accounts where username=?"); // SQL command that looks for the password associated with user
    if(!$stmt){
        printf("Query Prep Failed: %s\n", $mysqli->error);
        exit;
    }

    $stmt->bind_param('s', $name); // inputs $name for username in SQL command
    $stmt->execute();
    
    $stmt->bind_result($cnt, $password); // Pulls the number of rows matching the username and the password associated 
    $stmt->fetch();
    
    if($cnt == 1 && password_verify($pass, $password)){ // Compares entered pass with hashed pass and verifies that there is only one user
        $_SESSION['username'] = $name;
        $_SESSION['signedIn'] = true;
        $_SESSION['token'] = bin2hex(random_bytes(32)); // make a CSRF token to use throughout the webpage to ensure hackers haven't intruded
        $stmt->close(); 
        header('Location: home_page.php');
        ?>

        <?php
    exit;
    }
    
    else{
        header("Location: login.html"); 
    }
 
   }
else{
    header("Location: login.html"); 
}


?>
    
</body>
</html>
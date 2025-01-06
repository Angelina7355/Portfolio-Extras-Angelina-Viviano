<!DOCTYPE HTML>
<html lang="en">
<head><title>Login</title></head>
<body>
Create an account. <br><br>
 Make sure to type in a username and password or the account won't be made!
    <form action = "" method = "POST">
        <p>
            <label for = "userNameInput">Username:</label>
            <input type = "text" name = "username" id="userNameInput" />
        </p>

        <p>
            <label for ="passwordInput">Password:</label>
            <input type = "text" name = "password" id = "userPasswordInput"/>
        </p>
        
        <p>
            <input type = "submit" value = "Create Account" />
        </p>
    </form>
    
    <?php
    require 'database.php';
    if (isset($_POST['username']) && isset($_POST['password'])) {  // This is so the php code doesn't automatically run on loadup.
        if (!(empty($_POST['username']) || empty($_POST['password']))) { // Checks for empty input
            mysqli_report(MYSQLI_REPORT_OFF);
            $name = $_POST['username'];
            $pass = $_POST['password'];
            $name = htmlentities($name); // Allows for special characters
            $pass = password_hash($pass, PASSWORD_BCRYPT); // Encrypts password for varchar(255)


            if($mysqli->connect_errno) {
	            printf("Connection Failed: %s\n", $mysqli->connect_error);  // If fails
	            exit;
            }

            $stmt = $mysqli->prepare("insert into accounts (username, password) values (?, ?)"); // SQL code  where ? are inputs 
            if(!$stmt){
                printf("Query Prep Failed: %s\n", $mysqli->error);
                exit;
            }
    
            $stmt->bind_param('ss', $name, $pass); // Input vals ('var types', first input, second input)
    
            $stmt->execute();

            // Check for duplicate entry error (error code 1062)
            if ($stmt->errno == 1062) {
                echo "This username is already taken. Please choose another one.";
            } 
            else {
                $stmt->close();
                header("Location: login.html"); 
            }



        }

        else{
            echo "Please input a username and password."; 
        }

    }
    ?>

    
<form action = "login.html" method = "POST">
        <!-- Simple back button -->
        <p>
            <input type = "submit" value = "Go Back" />
        </p>
</form>        

</body>
</html>
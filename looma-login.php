<!doctype html>
<!--
LOOMA php code file
Filename: looma-login.php
Description: test program for login strategy

Programmer name:
Email:
Owner: VillageTech Solutions (villagetechsolutions.org)
Date:
Revision: Looma 2.0.x

Comments:
-->

<?php $page_title = 'Looma - Login';
      include ('includes/header.php');
      /*OPTIONAL*/ include ('includes/mongo-connect.php');
?>

</head>

<body>
<?php

/* This function determines an absolute URL and redirects the user there.
 * The function takes one argument: the page to be redirected to.
 * The argument defaults to index.php.
 */function redirect_user ($page = 'index.php') {

    // Start defining the URL...
    // URL is http:// plus the host name plus the current directory:

    // Remove any trailing slashes:
    $url = rtrim($url, '/\\');

    // Add the page:
    $url .= '/' . $page;

    // Redirect the user:
    header("Location: $url");
    exit(); // Quit the script.

} // End of redirect_user() function.

/* This function validates the form data (the email address and password).
 * If both are present, the database is queried.
 * The function requires a datab    $url = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']);
ase connection.
 * The function returns an array of information, including:
 * - a TRUE/FALSE variable indicating success
 * - an array of either errors or the database result
 */
function check_login($dbc, $email = '', $pass = '') {

    $errors = array(); // Initialize error array.

    // Validate the email address:
    if (empty($email)) {
        $errors[] = 'You forgot to enter your email address.';
    } else {
        $e = mysqli_real_escape_string($dbc, trim($email));
    }

    // Validate the password:
    if (empty($pass)) {
        $errors[] = 'You forgot to enter your password.';
    } else {
        $p = mysqli_real_escape_string($dbc, trim($pass));
    }

    if (empty($errors)) { // If everything's OK.

        // Retrieve the user_id and first_name for that email/password combination:
        $q = "SELECT user_id, first_name FROM users WHERE email='$e' AND pass=SHA1('$p')";
        $r = @mysqli_query ($dbc, $q); // Run the query.

        // Check the result:
        if (mysqli_num_rows($r) == 1) {

            // Fetch the record:
            $row = mysqli_fetch_array ($r, MYSQLI_ASSOC);

            // Return true and the record:
            return array(true, $row);

        } else { // Not a match!
            $errors[] = 'The email address and password entered do not match those on file.';
        }

    } // End of empty($errors) IF.

    // Return false and the errors:
    return array(false, $errors);

} // End of check_login() function.

    function loggedin() {
        // check cookie name=login

    } //end loggedin()

   if (!loggedin())
    {
         $errors = "";
         $name = $_GET["userid"];
         $pw =   $_GET["password"];

            if (!$name)
            { // error "enter a user name"
            }
            else if (!$pw) {
                // error "enter a password"
            }
            else if (!verifylogin($name, $pw))
            {
                //error "not a registered user name and password"
            }

            if ($errors)
            {
                // to get SELF:     $url = 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'];
                // use this in the 'action' of the login 'form'

                //send errors and login page
            }
            else login($name, $pw);
    }

    { // normal page here
        echo "normal php page appears here";
    }


?>


<?php
        /*include either, but not both, of toolbar.php or toolbar-vertical.php*/
          include ('includes/toolbar.php');
        /*include ('includes/toolbar-vertical.php'); */
          include ('includes/js-includes.php');
    ?>
</body>

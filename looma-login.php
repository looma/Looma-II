<!doctype html>
<!--
Filename: looma-login.php
Description: login function for Looma admin and teacher tool pages

Programmer Anika:
Owner: Looma Education Company
Date:  Summer 2016, revised Skip Jun 2020, and Mar 2022 [add seed and use sha256]
-->

<?php
require_once ('includes/looma-utilities.php');
require_once ('includes/mongo-connect.php');

function isLoggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);}

$loggedin = isLoggedIn();

    /*
     * check_login() checks login against database entries and returns either true indicating the
     * username and password matches an entry or false with an array containing
     * the login errors. $id is the username the client provided, and $pass is the
     * password the client entered.
     */
function check_login($id, $pass) {
    global $logins_collection;

    error_log("start check login for ".$id);
    $errors = array();  //array with all login errors

    //Validate id and add error if neccesary
    if (empty($id))
    {
        $errors[] = 'You forgot to enter your username.';
    }
    else
    {
        $name = addslashes($id);
    }

    //Validate the password and add error if neccesary
    if (empty($pass))
    {
        $errors[] = 'You forgot to enter your password.';
    }
    else
    {
        $p = addslashes($pass);
       // $p = SHA1($p);
    }

    //Checks if username and password match the database or add error to array
    // need connection to database
    if (empty($errors))
    {
        error_log ("Looma-login: check login id + pw in mongoDB");

/* NOTE, if install APCu (using PECL) then we can limit login attempts with this code
        $apc_key = "{$_SERVER['SERVER_NAME']}~login:{$_SERVER['REMOTE_ADDR']}";
        $tries = (int)apc_fetch($apc_key);
        if ($tries >= 3) {
            header("HTTP/1.1 429 Too Many Requests");
            echo "You've exceeded the number of login attempts. We've blocked IP address {$_SERVER['REMOTE_ADDR']} for a few minutes.";
            exit();
        };
*/
        $query = array('name' => $name); // 'pw' => $p);
        $r  = mongoFindOne($logins_collection, $query);

        if ($r == null  || encrypt($p,$r['salt']) !== $r['pw']) {
            $errors[] = "The username and password entered do not match those on file.";
        //    apcu_inc($apc_key, $tries+1, 600);  # store tries for 10 minutes
        }
        else {   //login succesfull
             return array(true, $name, isset($r['level']) ? $r['level']:'', isset($r['team']) ? $r['team']:'');
        //    apc_delete($apc_key);
        }
    }
    error_log("end check login");
    return array(false, $errors, null,null);
}  //end check_login

/*
 <?php
  $apc_key = "{$_SERVER['SERVER_NAME']}~login:{$_SERVER['REMOTE_ADDR']}";
  $tries = (int)apc_fetch($apc_key);
  if ($tries >= 10) {
    header("HTTP/1.1 429 Too Many Requests");
    echo "You've exceeded the number of login attempts. We've blocked IP address {$_SERVER['REMOTE_ADDR']} for a few minutes.";
    exit();
  }

  $success = login($_POST['username'], $_POST['password']);
  if (!$success) {
    apcu_inc($apc_key, $tries+1, 600);  # store tries for 10 minutes
  } else {
    apc_delete($apc_key);
  }
 */

// START of executed PHP code

   if(!$loggedin) {
    error_log("not logged in");

    if($_SERVER['REQUEST_METHOD'] == 'POST') {
        error_log("received a post login attempt");

        //Uses check_login function to return boolean with passing and errors with login
        list ($check, $data, $level, $team) = check_login($_POST['id'], $_POST['pass']);

       // echo "check is " . $check;
       // echo "level is " . $level;
       // echo "team is " . $team;
       // echo "data is " . $data;

        //if login successful set cookie and redirect_user to the PHP file
        if ($check) {
            echo $_POST['id'] . '  ' . $level . '  ' . $team;
            setcookie ("login", $_POST['id']);
            setcookie ("login-level", $level);
            setcookie ("login-team", $team);

            redirect_user("");
        }
        //Set errors to be displayed next login attempt
        else {
            error_log("not post");
            $errors = $data;
        }
    }  //end of if POST
   }// end of if not loggedin

$page_title = 'Looma - Login';
include('includes/header.php');
?>
<link rel="stylesheet" href="css/looma-login.css">

</head>

<body>
<div id="main-container-horizontal">
<?php
$page_title = 'Login';
   if(!$loggedin) {

       //Error message for potential errors with login
       if (isset($errors) && !empty($errors)) {
           error_log("errors");
           echo '<h1>Login error</h1>';
           echo '<p>The following error(s) occured:<br><br>';

           foreach ($errors as $msg) {
               echo '<p class="error">' . ($msg) . '</p><br />';
           }
           echo '<p>Please try again.</p>';
       }

       //The login form
       echo "<h1>Login</h1>
        <form method='post'>
            <p>Username: <input type='text'     name='id' size='20' maxlength='60' autofocus>  </p>
            <p>Password: <input type='password' name='pass' size='20' maxlength='20' >  </p>
            <p>
                <button type='submit'>Submit</button>
                <button type='button' onclick= 'window.location = \"home\"'>Cancel</button>
            </p>
        </form>";
   }
else {
// Print a  message:
     echo "<br><br><br><h1>Logged In</h1>";
     echo "<p>You are now logged in as '{$_COOKIE['login']}'</p>";
     //echo " <script>   var timeout = 1;
     //    setTimeout(function(){ window.location = window.history.go(-2);}, 3000 * timeout);
     //   </script>";

}
?>

	</div>

<?php   include ('includes/toolbar.php');
        include ('includes/js-includes.php');
?>

</body>

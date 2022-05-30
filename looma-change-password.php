<!doctype html>
<!--
Filename: looma-change-password.php
Description: password change function
Programmer Skip
Date:  Skip Jun 2020
-->

<?php

//function isLoggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);}

$page_title = 'Looma - Change Password';
require_once('includes/header.php');
require_once ('includes/looma-utilities.php');

$name = loggedIn();

/*
 * change_password() validates the inputs (old, new1, new2) and
 * checks attempts to change the pw of {user, old} and returns either true indicating the
 * username and password matched an entry and the pw has been changed
 *  or false with an array containing the login errors.
 */
function change_password($id, $old, $new1, $new2) {
    global $logins_collection;

    //error_log("start check login");
    $errors = array();  //array with all login errors

    //Validate id and collect error messages if any
    if (empty($id) || $id == '')
        $errors[] = 'You are not logged in';
    else $id = addslashes($id);

    //Validate the inputs
    if (empty($old))
        $errors[] = 'Please enter your old password.';
    //else {
    //    $oldSHA = SHA1(addslashes($old));
    //}

    if (empty($new1) || empty($new2) ||$new1 !== $new2)
        $errors[] = 'New passwords don\'t match.';
    else {
        $newsalt = salt();
        $newPW = encrypt(addslashes($new1),$newsalt);
    }

    //Updates the password if the name is in the database. NOTE could check old pw also. (not needed if 'name' field has unique index in mongp)
    if (empty($errors)) {

        //$query = array('name' => $id, 'pw' => $oldSHA);
        $query = array('name' => $id);
        $update = array('$set' => array('pw' => $newPW, 'salt' => $newsalt));

       //echo 'name is ' . $id . ' old is ' . $old . ' new is ' . $new1 . ' [$oldSHA is ' . $oldSHA . ' $newSHA is ' . $newSHA;
       $r  = mongoUpdate($logins_collection, $query, $update);

      // DEBUG  print_r ($r);  //exit;

        if ($r->getModifiedCount() !== 0)
        {
            //login succesfull
            $r = (array) $r;
            return array(true, $id, isset($r['level']) ? $r['level']:'', isset($r['team']) ? $r['team']:'');
        }
        else
        {
            $errors[] = "The username and (old) password entered do not match those on file.";
        }
    }
    //error_log("end check login");
    return array(false, $errors, null, null);
}  //end change_password


// START of executed PHP code
//include('includes/mongo-connect.php');

    if($_SERVER['REQUEST_METHOD'] == 'POST') {
        error_log("received a post pw change attempt");

        //Uses check_login function to return boolean with passing and errors with login

        //echo $name .' '. $_POST['old'] .' '. $_POST['new1'].' '. $_POST['new2']; exit();

        list ($check, $data, $level, $team) = change_password($name, $_POST['old'], $_POST['new1'], $_POST['new2']);

        //if password change was successful set cookie and redirect_user to the PHP file
        if ($check) {
            echo $data . '  ' . $level . '  ' . $team;
            //setcookie ("login", $_POST['id']);
            //setcookie ("login-level", $level);
            //setcookie ("login-team", $team);
            //redirect_user("index.php");
        }
        //Set errors to be displayed next login attempt
        else {
            error_log("not post");
            $errors = $data;
        }
    }  //end of if POST


?>
<link rel="stylesheet" href="css/looma-login.css">

</head>

<body>
<div id="main-container-horizontal">
    <?php
        //Error message for potential errors with input
        if (isset($errors) && !empty($errors)) {
            error_log("errors");
            echo '<h1>Password change error</h1>';
            echo '<p>The following error(s) occured:<br><br>';

            foreach ($errors as $msg) {
                echo '<p class="error">' . ($msg) . '</p><br />';
            }
            echo '<p>Please try again.</p>';
        }

        else {
        // Print a success message:
            echo "<br><br><br><h1>Password changed</h1>";
            echo "<p>You are logged in as '{$_COOKIE['login']}'</p>";
            /*
            echo " <script>
                var timeout = 1;
                setTimeout(function(){ window.location = window.history.go(-2);}, 3000 * timeout);
            </script>";
             */
        }

    //The change password form
        echo "<h1>Change Password</h1>
        <form method='post'>
            <p>Old password: <input type='password' name='old' size='20' maxlength='60' autofocus>  </p>
            <p>New password: <input type='password' name='new1' size='20' maxlength='20' >  </p>
            <p>New password: <input type='password' name='new2' size='20' maxlength='20' >  </p>
            <p>
                <button type='submit'>Submit</button>
                <button type='button' onclick= 'window.location = \"home\"'>Cancel</button>
            </p>
        </form>";
    ?>

</div>

<?php   include ('includes/toolbar.php');
        include ('includes/js-includes.php');
?>

</body>

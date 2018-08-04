<!doctype html>
<!--
Filename: looma-login.php
Description: login function for Looma admin and teacher tool pages

Programmer Anika:
Owner: VillageTech Solutions (villagetechsolutions.org)
Date:  Summer 2016

Comments:
-->

<?php $page_title = 'Looma - Login';
	  include ('includes/header.php');
	  include ('includes/mongo-connect.php');
?>

</head>

<body>
	<div id="main-container-horizontal">

<?php

    /*
     * check_login() checks login against database entries and returns either true indicating the
     * username and password matches an entry or false with an array containing
     * the login errors. $id is the username the client provided, and $pass is the
     * password the client entered.
     */
    function check_login($id, $pass)
    {
        global $logins_collection;

        error_log("start check login");
        $errors = array();  //array with all login errors

        //Validate id and add error if neccesary
        if (empty($id))
        {
            $errors[] = 'You forgot to enter your username.';
        }
        else
        {
            $name = addslashes($id);
        };

        //Validate the password and add error if neccesary
        if (empty($pass))
        {
            $errors[] = 'You forgot to enter your password.';
        }
        else
        {
            $p = addslashes($pass);
            $p = SHA1($p);
        };

        //Checks if username and password match the database or add error to array
        // need connection to database
        if (empty($errors))
        {
            error_log ("access logins collection in mongoDB");

            $query = array('name' => $name, 'pw' => $p);
            $r  = $logins_collection->findOne($query);

            if($r != null)
            {
                //login succesfull
                return array(true, $name);
            }
            else
            {
                $errors[] = "The username and password entered do not match those on file.";
            }

        };
        error_log("end check login");
        return array(false, $errors);
    };//end check_login

/*
 * Redirects user to the main php file if page is null or page specified
 *
 */
function redirect_user($page)  {

     if (!isset($page) or $page == null)
     {
        //$url = 'http://'.$_SERVER['HTTP_HOST'].($_SERVER['PHP_SELF']);
        //$url = rtrim($url, "/\\");
        //error_log("no page specified");

        $url = $_SERVER["HTTP_REFERER"];
        if (isset($_SERVER["HTTP_REFERER"])) {
            header("Location: " . $_SERVER["HTTP_REFERER"]);
        }
     }
     else
     {
        $url = 'http://'.$_SERVER['HTTP_HOST'].dirname($_SERVER['PHP_SELF']);
        $url .= '/'.$page;
     }
        error_log("exit $url");
        header("Location: $url");
        exit();
    };//end redirect_user

//Check for cookie

   //include looma-utilities.js before calling LOOMA.alert() below
   include ('includes/js-includes.php');

   if(!loggedin())
    {
    error_log("not logged in");
    //Check if login form has been submitted
    if($_SERVER['REQUEST_METHOD'] == 'POST')
    {
        error_log("received a post login attempt");

        //Uses check_login function to return boolean with passing and errors with login
        list ($check, $data) = check_login($_POST['id'], $_POST['pass']);

        //if login succesful set cookie and redirect_user to the PHP file
        if ($check)
        {
            setcookie ("login", $_POST['id']);
            redirect_user("");
        }
        //Set errors to be displayed next login attempt
        else
        {
            error_log("not post");
            $errors = $data;
        }// end of if login was found
    };//end of if POST

    $page_title = 'Login';
    //include ('include/header.html');

    //Error message for potential errors with login
    if (isset($errors) && !empty($errors))
    {
        error_log("errors");
        echo '<h1>Login error</h1>';
        echo '<p>The following error(s) occured:<br><br>';

        foreach ($errors as $msg)
        {
            echo '<p class="error">' . ($msg) . '</p><br />';
        }
        echo '<p>Please try again.</p>';
    }

    //The login form
    echo "<!doctype html>
        <h1>Login</h1>
        <form method='post'>
            <p>Username: <input type='text'     name='id' size='20' maxlength='60' autofocus>  </p>
            <p>Password: <input type='password' name='pass' size='20' maxlength='20' >  </p>
            <p>
                <button type='submit'>Submit</button>
                <button type='button' onclick= 'window.location = \"index.php\"'>Cancel</button>
            </p>
        </form>";
    //exit();
} //end if not login
else {
// Print a  message:
     echo "<br><br><br><h1>Logged In</h1>";
     echo "<p>You are now logged in as '{$_COOKIE['login']}'</p>";
     echo " <script>   var timeout = ;
        /*LOOMA.alert('You are now logged in', 3, true);*/
        setTimeout(function(){ window.location = window.history.go(-2);}, 1000 * timeout);
        </script>";
 /*    echo "<script>   var timeout = 8;" .
        "LOOMA.alert('You are now logged in', timeout, true);" .
        "setTimeout(function(){  console.log('logged in'); window.location = window.history.go(-2);}, 1000 * timeout);" .
        "</script>"; */
};
?>

	</div>

    <?php   include ('includes/toolbar.php');
    ?>
    <script src="js/looma-login.js">  </script>
</body>

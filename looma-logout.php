<!doctype html>
<!--
LOOMA php code file
Filename: xxx.php
Description:

Programmer name:
Email:
Owner: VillageTech Solutions (villagetechsolutions.org)
Date:
Revision: Looma 2.0.x

Comments:
-->

<?php $page_title = 'Looma - Logout';
	  include ('includes/header.php');
	  /*OPTIONAL*/ include ('includes/mongo-connect.php');
?>

</head>

<body>
	<div id="main-container-horizontal">
<?php
 // This page lets the user logout.

function redirect_user($page)
{
    if (isset($page) or $page == null)
    {
        $url = 'http://'.$_SERVER['HTTP_HOST'].($_SERVER['PHP_SELF']);
        $url = rtrim($url, "/\\");
        error_log("no page specified");
    }
    else
    {
        $url = 'http://'.$_SERVER['HTTP_HOST'].dirname($_SERVER['PHP_SELF']);
        $url .= '/'.$page;
    }

    error_log("exit $url");
    header("Location: $url");
    exit();
}

 // If no cookie is present, redirect the user:
     if (isset($_COOKIE['login']))
     {
        // Delete the cookie. it was set with:
        //setcookie ('login', $_POST['id']);
          setcookie ("login", "", time()-3600); //deletes the cookie

          $name = $_COOKIE['login'];
   } else $name = "";

     // Set the page title and include the HTML header:
     $page_title = 'Loggedout';

?>
<?php  //include looma-utilities.js before calling LOOMA.alert() below
     include ('includes/js-includes.php');

    // Print a  message:
     echo "<br><br><br><h1>Logged Out</h1>";
     echo "<p>You are now logged out" . (($name)? ', ' . $name : '') . "</p>";
     echo "<script>   var timeout = 4;
        /*LOOMA.alert('You are now logged out', 3, true);*/
        setTimeout(function(){   console.log('logged out'); window.location = window.history.back();}, 1000 * timeout);</script>";
?>
	</div>

<?php
   		/*include either, but not both, of toolbar.php or toolbar-vertical.php*/
	      include ('includes/toolbar.php');
   		/*include ('includes/toolbar-vertical.php'); */
    ?>

</body>

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

<?php $page_title = 'Looma - Login';
	  include ('includes/header.php');
	  /*OPTIONAL*/ include ('includes/mongo-connect.php');
?>

</head>

<body>
	<div id="main-container-horizontal">
<?php

if($_SERVER['REQUEST_METHOD'] == 'POST')
    {
        $name =  $_POST['id'];
        $pw = addslashes($_POST['pass']);
        $encrypted_pw = SHA1($pw);

        $insert = array('name' => $name, 'pw' => $encrypted_pw);
        $logins_collection->insert($insert);

        echo "<h1>User added</h1>
        <p>A new user, <em>$name</em>, was added</p>";

    }
?>
        <h1>Register a new user</h1>
        <form method="post" autocomplet"off">
            <p> Username: <input type="text" placeholder="enter user name"
            name="id" size="20" maxlength="60" />
            </p>
            <p>Password: <input type="password"  placeholder="password"
            name="pass" size="20" maxlength="20" />
            </p>
            <p><button type = "submit">Submit</button>
        </form>

	</div>

<?php
   		/*include either, but not both, of toolbar.php or toolbar-vertical.php*/
	      include ('includes/toolbar.php');
   		/*include ('includes/toolbar-vertical.php'); */
   		  include ('includes/js-includes.php');
    ?>
</body>

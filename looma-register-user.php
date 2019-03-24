<?php
function XloggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);};

// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = XloggedIn(); if (!$loggedin) header('Location: looma-login.php');
error_log("Starting Dictionary Edit session. logged in as: " . $loggedin);
?>

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
	  include ('includes/mongo-connect.php');
?>
<link rel="stylesheet" href="css/looma-register-user.css">

</head>

<body>
	<div id="main-container-horizontal">
<?php

if($_SERVER['REQUEST_METHOD'] == 'POST')
    {
        if (isset($_POST['show-users'])) {
            $query = array();

            $projection = array('name' => 1);
            $logins = $logins_collection -> find($query, $projection);
            $logins->sort(array('name' => 1));

            foreach ($logins as $login) {
                echo "user name: " . $login['name'] . "<br>";
            }
        } else if (isset($_POST['deletename'])) {
            $name = $_POST['deletename'];
            if ($name == 'skip' || $name == 'kabin') {
                echo "<h1>User NOT deleted</h1>
                <p>Cannot delete administrator user <em>$name</em></p>";
            }
            else {
                $query = array('name' => $name);
                $logins = $logins_collection -> remove($query);

                echo "<h1>User deleted</h1>
                <p>User <em>$name</em>, was deleted</p>";
                }
        } else
        {

        $name =  $_POST['id'];
        $pw = addslashes($_POST['pass']);
        $encrypted_pw = SHA1($pw);

        $query = array('name' => $name);
        $insert = array('name' => $name, 'pw' => $encrypted_pw);
        $logins_collection->update($query, $insert, array('upsert' => true));

        echo "<h1>User added</h1>
        <p>A new user, <em>$name</em>, was added</p>";
        }
    }
?>
        <h1>Register a new user</h1>
        <form method="post" autocomplete="off">
            <p> Username: <input type="text" autocomplete="off" placeholder="enter user name"
                                 name="id" size="20" maxlength="60" />
            </p>
            <p>Password: <input type="password"  placeholder="password"
                                name="pass" size="20" maxlength="20" />
            </p>
            <p><button type = "submit">Submit</button>
        </form>

        <h1>Delete a user</h1>
        <form method="post" autocomplete="off">
            <p> Username: <input type="text" autocomplete="off" placeholder="enter user name"
                                 name="deletename" size="20" maxlength="60" />
            </p>
            <p><button type = "submit">Submit</button>
        </form>

        <br><br><br>

        <form method="post">
            <input type="text" hidden name="show-users" value="show-users">
            <button >Show list of users</button>
        </form>
	</div>

<?php
   		/*include either, but not both, of toolbar.php or toolbar-vertical.php*/
	      include ('includes/toolbar.php');
   		/*include ('includes/toolbar-vertical.php'); */
   		  include ('includes/js-includes.php');
    ?>
</body>

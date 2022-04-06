<?php
function isLoggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);}

function loginLevel() { return $_COOKIE['login-level'];}

// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = isLoggedIn(); if (!$loggedin || loginLevel() !== 'exec') header('Location: looma-login.php');
error_log("Starting Register User session. logged in as: " . $loggedin);
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

<?php $page_title = 'Looma - Register User';
    require_once ('includes/header.php');
    require_once ('includes/looma-utilities.php');

?>
<link rel="stylesheet" href="css/looma-register-user.css">

</head>

<body>
	<div id="main-container-horizontal">
<?php

if($_SERVER['REQUEST_METHOD'] == 'POST')
    {
       //// "show users" function
       if (isset($_POST['show-users'])) {  // SHOW USERS  - return a list of registered user
            $query = array();

            $projection = array('_id' => 0, 'name' => 1, 'team' => 1);
            $logins = mongoFind($logins_collection, $query, 'name', null, null);
           // $logins->sort(array('name' => 1 ));

            foreach ($logins as $login) {
                echo "user name: " . $login['name'];
                if (isset($login['team'])) echo "  (team: " . $login['team'] . ')';
                echo "<br>";
            }
        }        //// "delete user function
       else if (isset($_POST['deletename'])) { // DELETE USER  - remove a registered user
            $name = $_POST['deletename'];
            if ($name == 'skip' || $name == 'kabin') {
                echo "<h1>User NOT deleted</h1>
                <p>Cannot delete administrator user <em>$name</em></p>";
            }
            else {
                $query = array('name' => $name);
                $logins = mongoDeleteOne($logins_collection, $query);

                echo "<h1>User deleted</h1>
                <p>User <em>$name</em>, was deleted</p>";
                }
        } else   // ADD USERS  - register a user
        {

        $name =  $_POST['id'];
        $pw = addslashes($_POST['pass']);
        $team = isset( $_POST['team']) ?  $_POST['team'] : '';
        $level = isset( $_POST['level']) ?  $_POST['level'] : '';
        $salt = salt();
            // echo ('salt is ' . $salt);
        $encrypted_pw = encrypt($pw,$salt);

        $query = array('name' => $name);
        $insert = array('name' => $name, 'pw' => $encrypted_pw, 'salt' => $salt, 'team' => $team, 'level' => $level);
        mongoUpsert($logins_collection, $query, $insert);

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
            <p>Team [optional]: <input type="text"  placeholder="enter team name"
                                       name="team" size="20" maxlength="20" />

            <p><label for="title">Level [optional]:</label>
                <select id="level" name="level">
                    <option value="none" selected>(none)</option>
                    <option value="translator">translator</option>
                    <option value="admin">admin</option>
                    <option value="exec">exec</option>
                </select>
            </p><p><button type = "submit">Submit</button>
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
	      include ('includes/toolbar.php');
   		  include ('includes/js-includes.php');
    ?>
</body>

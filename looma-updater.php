<?php
//function isLoggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);}
require_once('includes/looma-isloggedin.php');

// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = loggedIn(); if (!$loggedin) header('Location: looma-home.php');
error_log("Starting Update session. logged in as: " . $loggedin);

if (isset($_REQUEST['option']) && $_REQUEST['option'] === 'includecontent') $option = "incudecontent";
else $option = "";

$shellcommand = 'date >> /tmp/loomaupdate.txt';

if (isset($_REQUEST['cmd']) && $_REQUEST['cmd'] === 'update') {
    echo "executed shell command: $shellcommand";
    $result = shell_exec($shellcommand);
    echo $result;
    exit;
} else if (isset($_REQUEST['cmd']) && $_REQUEST['cmd'] === 'nwspeed') {
        //echo 'Checking network speed...';
    $r = shell_exec('speedtest  --no-upload --secure | grep Download:');
    //$r = shell_exec('pwd');
        echo $r;
        exit;
    } else {
    echo "ERROR: no command given";
    exit;
}
?>
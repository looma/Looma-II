<?php
function loggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);}
function loginLevel() { return $_COOKIE['login-level'];};
?>
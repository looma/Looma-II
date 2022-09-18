<?php
function loggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);}
?>
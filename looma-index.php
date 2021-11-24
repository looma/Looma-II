<?php
    //if cookie THEME === CEHRD  set cookie THEME = looma
    //echo $_COOKIE['theme']; exit;

    if(isset($_COOKIE['theme']) && $_COOKIE['theme'] === 'CEHRD')
        setcookie("theme", "looma",0,"/");
    // redirect to looma-home.php
    header('Location: looma-home.php');
?>
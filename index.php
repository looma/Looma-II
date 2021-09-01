<?php
//if cookie THEME === CEHRD  set cookie THEME = looma
//echo $_COOKIE['theme']; exit;

if(isset($_COOKIE['theme']) && $_COOKIE['theme'] === 'CEHRD') {

    $domain = ($_SERVER['HTTP_HOST'] != 'localhost') ? $_SERVER['HTTP_HOST'] : false;

    $arr_cookie_options = array(
        'expires' => time() + 60 * 60 * 24 * 30,
        'path' => '/Looma',
        'domain' => $domain, // leading dot for compatibility or use subdomain
        'secure' => true,     // or false
        'httponly' => false,    // or false
        'samesite' => 'None' // None || Lax  || Strict
    );
    setcookie('theme', 'looma', $arr_cookie_options);

    //setcookie('theme', "looma");
}
// redirect to looma-home.php
header('Location: looma-home.php');
?>


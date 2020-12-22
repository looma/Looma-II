<?php
function isLoggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);};

// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = isLoggedIn(); if (!$loggedin) header('Location: looma-login.php');
error_log("Starting Dictionary Edit session. logged in as: " . $loggedin);
?>


<?php $page_title = 'Looma Speech Test Page';
require_once ('includes/header.php');
define ("CLASSES", 8);
?>

<link rel="stylesheet" href="css/looma.css">
<link rel="stylesheet" href="css/looma-speech-test.css">

</head>

<body>
    <div id="main-container-horizontal">
        <p id="prompt">Enter a phrase to speak:  </p>
        <input type="text" id="text" size="250" value="Hello this is Looma"> </input>
        <button id="mimic">Speak with mimic </button>
        <button id="synthesis">Speak with speechSynthesis [Looma default]</button>

        <div id="rateDiv">
            <span>Enter speech slowdown here (higher is slower)</span>
            <select id="rate">
                <option value="0.50">1/2</option>
                <option value="0.67">2/3</option>
                <option value="1" selected>1</option>
                <option value="1.5">1.5</option>
                <option value="2">2</option>
            </select>
        </div>
    </div>
    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>

    <script src="js/looma-speech-test.js"></script>
</body>

</html>

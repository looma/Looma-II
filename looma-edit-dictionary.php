<?php
function isLoggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);};

// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = isLoggedIn(); if (!$loggedin) header('Location: looma-login.php');
error_log("Starting Lesson Plan Edit session. logged in as: " . $loggedin);
?>

<!--
Filename: looma-edit-dictionary.php
Description: editor for dictionary

Programmer name: Skip, Charlotte
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: June 2021
Revision: Looma 6.4
 -->

<?php $page_title = 'Looma Dictionary Editor';
include ('includes/header.php');

?>
<link rel = "Stylesheet" type = "text/css" href = "css/looma-edit-dictionary.css">
</head>
<body>
<div id="main-container-horizontal">
    <div id="fullscreen">
        <?php include ('includes/looma-control-buttons.php');?>
        <br>

        <h1 class="title"> <?php keyword("Looma Dictionary Editor"); ?> </h1>

        <!-- where the user inputs a word -->
        <form id="lookup">
            <?php keyword("Enter word"); ?>
            <input type="text"  id="input" autofocus autocomplete="off">
            <button type="submit" id="submit" value="submit"> <?php keyword("Search"); ?> </button>
        </form>

        <!-- where the user can choose to add a row -->
        <button type="submit" id="addButton">Add Entry</button>

        <!-- where the information about the word is displayed -->
        <div id="titles">
            <table id="titleTable">
                <tr>
                    <th class="hiddenID"></th>
                    <th class="enCol column">en</th>
                    <th class="nepCol column">np</th>
                    <th class="posCol column">part</th>
                    <th class="pluralCol column">plural</th>
                    <th class="rootCol column">rw</th>
                    <th class="ch_idCol column">ch_id</th>
                    <th class="defCol column">definition</th>
                    <th class="empty1"></th>
                    <th class="empty2"></th>
                </tr>
            </table>
        </div>

        <!-- where the word confirmation fields are displayed -->
        <div id="confirm">
            <table id="confirmTable">
                <tr>
                    <th class="hiddenID"></th>
                    <th class="enCol column">en</th>
                    <th class="nepCol column">np</th>
                    <th class="posCol column">part</th>
                    <th class="pluralCol column">plural</th>
                    <th class="rootCol column">rw</th>
                    <th class="ch_idCol column">ch_id</th>
                    <th class="defCol column">definition</th>
                    <th class="empty1"></th>
                </tr>
                <tr id="confirmFields">
                    <th class="hiddenID" id="confirm-id"></th>
                    <th class="enCol2 confirmColumn" id="confirm-en"></th>
                    <th class="nepCol2 confirmColumn" id="confirm-np"></th>
                    <th class="posCol2 confirmColumn" id="confirm-part"></th>
                    <th class="pluralCol2 confirmColumn" id="confirm-plural"></th>
                    <th class="rootCol2 confirmColumn" id="confirm-rw"></th>
                    <th class="ch_idCol2 confirmColumn" id="confirm-ch_id"></th>
                    <th class="defCol2 confirmColumn" id="confirm-definition"></th>
                    <td><button type="submit" id="saveButton"> <?php keyword("Save"); ?> </button></td>
                </tr>
            </table>
        </div>

    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>

<script src="js/jquery-ui.min.js"></script>
<script src="js/jquery.hotkeys.js"></script>
<script src="js/tether.min.js"></script>
<script src="js/bootstrap.min.js"></script>

<script src="js/looma-edit-dictionary.js"></script>

</body>
</html>

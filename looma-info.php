<!doctype html>
<!--
extra comment
Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: JAN 2022
Revision: Looma 3.0.0
File: looma-info.php
Description:  for Looma 2
-->
<?php $page_title = 'Looma Information';
include ('includes/header.php');
//logPageHit('info');
?>
<link rel="stylesheet" href="css/font-awesome.min.css">
<link rel="stylesheet" href="css/looma-info.css">

</head>

<body>
<div id="main-container-horizontal">

        <div id="logo">
        <?php
      //      if($_COOKIE['theme'] === 'CEHRD' || isset($_COOKIE["source"]) &&  $_COOKIE["source"] === 'CEHRD') {
            if($LOOMA_SERVER === 'CEHRD') {
                echo '<img draggable="false" class="english-keyword" src="images/logos/CEHRD-banner-english.jpg" class="cehrd-logo">';
                echo '<img draggable="false" class="native-keyword" src="images/logos/CEHRD-banner-nepali.jpg" class="cehrd-logo">';
            }  else {   // $LOOMA_SERVER is 'looma' or 'looma local'
                echo '<img draggable="false" src="images/logos/LoomaLogoTransparent.png" class="loomalogo">';
                echo '<img src="images/trademark4.png" id="trademark" height="33px">';
            }
        ?>
        </div>
        <div id="title">
            <?php
            //if($_COOKIE['theme'] === 'CEHRD' || isset($_COOKIE["source"]) &&  $_COOKIE["source"] === 'CEHRD') {
            if($LOOMA_SERVER === 'CEHRD') {
                // echo '<h1 id="title" class="title">Learning Portal Information</h1>';
            }  else {   // $LOOMA_SERVER is 'looma' or 'looma local'
                echo '<img src="images/trademark4.png" id="trademark" height="33px">';
                echo '<h1 id="title" class="title">Looma Information</h1>';
            }
            ?>
        </div>
        <div id="about">
            <div id="copyright"><h3>Looma</h3>
                <h4>   Release 7.9.1 MAR 2023   </h4>
                <img src ='images/copyright.png' class="copyright"></img>2023
            </div>

    <?php
        if(isset($_COOKIE["source"]) &&  $_COOKIE["source"] === 'CEHRD') {
            echo "<a draggable='false'  class='footer' href='https://www.cehrd.gov.np/'>by Center for Education and Human Resources Development</a>";
            echo "<h4>Contact: ";
            echo "<a href='mailto:iemis@cehrd.gov.np'>iemis@cehrd.gov.np</a>";
            echo "</h4>";
        } else { // source = looma
            echo "<a draggable='false'  class='footer' href='https://looma.education'>by Looma Education Company</a>";
            echo "<h4>Contact:  info AT looma DOT education</h4>";

            echo 'This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">';
            echo 'Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>';
            echo '<img draggable="false"  alt="Creative Commons License" src="images/logos/CC-BY-NC-SA.png" height="33px">';
      }
          ?>
        </div>
        <div id="logos">
            <h5> Attributions for code and content used in this portal</h5>

            <!--  ADD HOVER INFORMATION FOR EACH LOGO, WITH ATTRIBUTION, NAME/ADDRESS/URL -->

            <a draggable="false"  draggable="false" class="attribution" href="https://www.cehrd.gov.np/" target="_blank">
                <img draggable="false" src="images/logos/CEHRD-logo.png" height="66px"></a>
            <a draggable="false"  draggable="false" class="attribution" href="https://erdcn.org/" target="_blank">
                <img draggable="false" src="images/logos/ERDCN.png" height="66px"></a>
            <a draggable="false"  draggable="false" class="attribution" href="http://www.khanacademy.org" target="_blank">
                <img draggable="false" src="images/logos/khan.jpg" height="66px"></a>
            <a draggable="false"  class="attribution" href="http://www.olenepal.org" target="_blank">
                <img draggable="false" src="images/logos/ole-nepal.jpg" height="66px"></a>
            <a draggable="false"  class="attribution" href="https://www.wikipedia.org" target="_blank">
                <img draggable="false" src="images/logos/wikipedia.jpg" height="66px"></a>
            <a draggable="false"  class="attribution" href="https://phet.colorado.edu" target="_blank">
                <img draggable="false" src="images/logos/PHET.png" height="44px"></a>
            <a draggable="false"  class="attribution" href="https://ed.ted.com" target="_blank">
                <img draggable="false" src="images/logos/TedEd.jpg" height="44px"></a>
       <!--
            <a draggable="false"  class="attribution" href="https://leafletjs.com" target="_blank">
                <img draggable="false" src="images/logos/leaflet-logo.png" height="66px"></a>
            <a draggable="false"  class="attribution" href="https://www.openstreetmap.org" target="_blank">
                <img draggable="false" src="images/logos/openstreetmap-logo.png" height="66px"></a>
            <a draggable="false"  class="attribution" href="https://translate.google.com" target="_blank">
                <img draggable="false" src="images/logos/google-translate.jpg" height="66px"></a>
            <a draggable="false"  class="attribution" href="https://www.mapbox.com" target="_blank">
                <img draggable="false" src="images/logos/tilemill.png" height="66px"></a>
            <br>
    -->
            <a draggable="false"  draggable="false" class="attribution" href="https://looma.education" target="_blank">
                <img draggable="false" src="images/logos/Looma-english-amanda.png" height="66px"></a>
            <a draggable="false"  draggable="false" class="attribution" href="http://www.menschen-im-dialog.de/" target="_blank">
                <img draggable="false" src="images/logos/menschen-im-dialog_BLACK.png" height="66px"></a>
            <a draggable="false"  class="attribution" href="https://hesperian.org" target="_blank">
                <img draggable="false" src="images/logos/hesperian.png" height="33px"></a>
            <a draggable="false"  class="attribution" href="https://mycroft.ai" target="_blank">
                <img draggable="false" src="images/logos/mycroft.png" height="33px"></a>
    <!--
            <a draggable="false"  class="attribution" href="https://jquery.com" target="_blank">
                <img draggable="false" src="images/logos/jquery-logo.png" height="66px"></a>
            <a draggable="false"  class="attribution" href="https://aws.amazon.com" target="_blank">
                <img draggable="false" src="images/logos/AWS.png" height="66px"></a>
            <span><img draggable="false" src="images/logos/css3-html5-logo.png" height="44px"></span>
            <a draggable="false"  class="attribution" href="https://www.mongodb.com" target="_blank">
                <img draggable="false" src="images/logos/mongodb-logo.png" height="66px"></a>
            <a draggable="false"  class="attribution" href="https://www.jetbrains.com/?from=Looma" target="_blank">
                <img draggable="false" src="images/logos/jetbrains.svg" height="44px"></a>
            <a draggable="false"  class="attribution" href="https://www.stackoverflow.org" target="_blank">
                <img draggable="false" src="images/logos/stackoverflow.png" height="66px"></a>
    -->

        </div>
    <div id="log-viewer">
        <button id="line"> <?php tooltip("Activity Logs") ?> System Usage </button>
    </div>
        <div id="info-panel">
        <?php
            if(isset($_COOKIE["source"]) &&  $_COOKIE["source"] !== 'CEHRD') {
                //echo '<span><img draggable="false" src="images/logos/LoomaLogoTransparent.png" class="loomalogo"></span>';
                //echo '<img src="images/trademark4.png" id="trademark" height="33px">';
            }
        ?>
        <h4>Tested only in Google Chrome</h4>

        <?php
        if(isset($_COOKIE["source"]) &&  $_COOKIE["source"] === 'CEHRD') {
            echo "<h4>Report bugs and suggestions to:  ";
            echo "<a href='mailto:iemis@cehrd.gov.np''>iemis@cehrd.gov.np</a>";
            echo "</h4>";
        } else
            echo "<h4>Report bugs and suggestions to:  info AT looma DOT education</h4>";
        ?>
        </div>
        <h2 id="credits-title">Contributors</h2>
        <div id="credits">
        <ul>

            <li> </li><li> </li><li> </li><li> </li><li> </li> <!-- these empty 'li's give a pause at the start -->
            <li>  - -  </li>

        <?php
            //$volunteers = $volunteers_collection -> find();      //get volunteer names
            $volunteers = mongoFind($volunteers_collection, [], null, null, null);      //get volunteer names
            $volunteerlist = iterator_to_array($volunteers);     //convert to array
            shuffle($volunteerlist);                      //randomize the order
            foreach ($volunteerlist as $volunteer) echo "<li>" . $volunteer['name'] . "</li>";
        ?>

            <li>  - -  </li>
        </ul>
    </div>
        <div id="system_info" >
            <button id="advanced_button">System Info</button>
            <div id="advanced_info">
                <p class="screensize"></p>
                <p class="bodysize"></p>

                <p class="mongo-version">MongoDB version: <?php global $mongo_version; echo $mongo_version ?> </p>

                <p class="php-version">PHP version: <?php echo phpversion();?></p>
                <?php

                global $ENV_OS;
                echo '<p class="system">OS:  ' . $ENV_OS . '</p>';

                global $ENV_CPU;
                echo '<p class="system">CPU:  ' . $ENV_CPU . '</p>';

                    //$sys = shell_exec('cat /proc/cpuinfo | grep Hardware');
                    //echo '<p class="system">CPU:  ' . $sys . '</p>';

                echo '<p class="system">Server: ' . $_SERVER['SERVER_NAME'] . '</p>';
                    //echo '<p class="system">Browser: ' . $_SERVER['HTTP_USER_AGENT'] . '</p>';

                if ($_SERVER['SERVER_NAME'] !== 'looma.website') {
                    global $ENV_IP;
                    if (! $ENV_IP || $ENV_IP === '' || $ENV_IP === "127.0.0.1")
                         $ip = "Not Connected";
                    else $ip = $ENV_IP;
                    echo '<p class="system">IP:  ' . $ip . '</p>';
                }
                //want to display IP address for remote access, until we have zeroconf
                    //NOTE: want the external IP for this LOOMA, but 127.0.0.1 "localhost" will show on projected page
                    //echo "<p class=\"ip\">IP Address: " . gethostbyname('localhost') . "</p>";
                    //$ip = shell_exec('/usr/local/bin/loomaIP');
                    //echo '<p class="ip">IP Address: ' . $ip . '</p>';
                    //echo '<p>pid: ' . getmypid() . '</p>';
                ?>
            </div>
        </div>
        <!-- W3C validator link    new URL=https://validator.w3.org/nu/
           <a draggable="false"  class="footer" href="https://validator.w3.org/nu/check?uri=referer">&nbsp &nbsp (V)</a> -->
</div>

<?php
/*if ($LOOMA_SERVER === "CEHRD") {
    echo "<marquee id='marquee'>";
    echo "This CEHRD Learning Portal is still under construction. We welcome comments to ";
    echo "<a href='mailto:iemis@cehrd.gov.np''>iemis@cehrd.gov.np</a>";
    echo ". Thank you.";
    echo "</marquee>";
}*/
?>

<?php include ('includes/toolbar.php');
include ('includes/js-includes.php');
?>
<script src="js/jquery.easy-ticker.js"></script>
<script src="js/looma-info.js"></script>

</body>
</html>

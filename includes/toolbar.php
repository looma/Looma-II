
<link rel="stylesheet" href="css/looma-toolbar.css">

    <div id="toolbar-container" class="toolbar">
 		<div class="button-div" id="toolbar">

        <!--TRANSLATE-->
		<button id="translate" class="toolbar-button flag">
				<img id="flag" draggable="false" src="images/english-flag.png">
				<?php tooltip("अनुवाद") ?>
			</button>

            <!--HOME-->
 			<button onclick="parent.location.href = 'looma-home.php';"  id="toolbar-home" class="toolbar-button">
 				<img draggable="false" src="images/home.png"  height = "80%" >
				<?php tooltip("Home") ?>
 			</button>

            <!--LIBRARY-->
			<button onclick="LOOMA.setStore('libraryScroll', 0, 'session');
			                 LOOMA.clearStore('library-search',     'session');
                             parent.location.href = 'looma-library.php?fp=../content/';"
                    id="toolbar-library" class="toolbar-button ">
				<!-- call looma-library.php with path to starting folder of the Library. -->
				<img draggable="false" src="images/library.png"  height= "80%" >
				<?php tooltip("Library") ?>
			</button>

            <!--LBRARY SEARCH-->
			<button onclick="LOOMA.setStore('libraryScroll', 0, 'session');
			                 LOOMA.clearStore('library-search',     'session');
                             parent.location.href = 'looma-library-search.php?fp=../content/';"
                    id="toolbar-search" class="toolbar-button ">
				<!-- search looma-library.php with path to starting folder of the Library. -->
				<img draggable="false" src="images/search.png"  height= "80%" >
				<?php tooltip("Search") ?>
			</button>

            <!--DICTIONARY-->
			<button onclick="parent.location.href = 'looma-dictionary.php';"
                    id="toolbar-dictionary" class="toolbar-button ">
				<img draggable="false" src="images/dictionary.png"  height= "80%" >
				<?php tooltip("Dictionary") ?>
			</button>

            <!--PAINT-->
			<button onclick="parent.location.href = 'looma-paint.php?ModPagespeed=off';"
                    id="toolbar-paint" class="toolbar-button ">
				<img draggable="false" src="images/paint.png" height = "80%"  >
				<?php tooltip("Paint") ?>
			</button>

            <!--CLOCK-->
            <button onclick="parent.location.href = 'looma-clock.php';"
                    id="toolbar-clock" class="toolbar-button ">
                <img draggable="false" src="images/clock.png"  height = "80%" >
                <?php tooltip("Clocks") ?>
            </button>

            <!--MAPS-->
            <button onclick="parent.location.href = 'looma-maps.php';"
                    id="toolbar-maps" class="toolbar-button ">
                <img draggable="false" src="images/maps.png"  height = "80%" >
                <?php tooltip("Maps") ?>
            </button>

            <!--HISTORIES-->
            <button onclick="parent.location.href = 'looma-histories.php';"
                    id="toolbar-histories" class="toolbar-button ">
                <img draggable="false" src="images/history.png"  height = "80%" >
                <?php tooltip("History") ?>
            </button>

            <!--GAMES-->
			<button onclick="parent.location.href = 'looma-games.php';"
                    id="toolbar-games" class="toolbar-button ">
				<img draggable="false" src="images/games.png"  height = "80%" >
				<?php tooltip("Games") ?>
			</button>

            <!--CALCULATOR-->
			<button onclick="parent.location.href = 'looma-calculator.php';"
                    id="toolbar-calculator" class="toolbar-button ">
				<img draggable="false" src="images/calc.png"  height = "80%" >
				<?php tooltip("Calculator") ?>
			</button>

            <!--WEB-->
			<button onclick="parent.location.href = 'looma-web.php';"
                    id="toolbar-web" class="toolbar-button ">
				<img draggable="false" src="images/web.png"  height = "80%" >
				<?php tooltip("Web") ?>
			</button>


            <!-- EDIT MADE  on line 20 to include video recorder button on the toolbar w/ image -->
            <!--VIDEO RECORDER-->
        <!--
            <button hidden onclick="parent.location.href = 'looma-video-recorder.php';"
                    id="toolbar-record" class="toolbar-button">
                <img draggable="false" src="images/video_record.png"  height = "80%" >
                <?php tooltip("Home") ?>
            </button>
        -->

            <!--SETTINGS-->
			<button onclick="parent.location.href = 'looma-settings.php';"
                    id="toolbar-settings" class="toolbar-button ">
				<img draggable="false" src="images/settings.png"  height = "80%" >
				<?php tooltip("Tools") ?>
			</button>

            <!--INFO-->
			<button onclick="parent.location.href = 'looma-info.php';"
                    id="toolbar-info" class="toolbar-button ">
				<img draggable="false" src="images/info.png"  height = "80%" >
				<?php tooltip("Info") ?>
			</button>

            <!--BACK ARROW-->
			<button  class="toolbar-button back-button">
				<img draggable="false" src="images/back-arrow.png" height = "80%"  >
				<?php tooltip("Back") ?>
			</button>

            <!--FORWARD-->
			<!-- <button  class="toolbar-button" onclick="parent.history.forward()">
				<img draggable="false" src="images/forward-arrow.png" width = "60px" height = "80%" ></button>   -->
        </div>

		<div id="logo-div">
			<span class="logo">
                <span class="english-keyword" draggable="false"> Supported by </span>
                <span class="native-keyword" draggable="false"> सहयोग कर्ता </span>
                <img  class="toolbar-logo english-keyword"  src="images/logos/Looma-english-amanda 3x1.png" >
			    <img  class="toolbar-logo native-keyword" hidden draggable="false" src="images/logos/Looma-nepali-amanda 3x1.png" >
      		</span>
            <br>
			<span id="datetime"></span>

            <!-- NOTE: display AMAZON  logo is we can detect that this instance of looma is running on AWS
            <span id="amazon"><img src="images/logos/amazon.png"></span>
            -->
		</div>

        <img id="padlock"
             draggable="false"
             src="  <?php echo loggedIn() ? "images/padlock-open.png" : "images/padlock-closed.png"; ?>" >

        <p id="login-id" ><?php if (loggedIn()) echo "You are logged in as '" . $_COOKIE['login'] ."'" ?></p>

    </div>

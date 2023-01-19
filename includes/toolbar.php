
<link rel="stylesheet" href="css/looma-toolbar.css">

    <div id="toolbar-container" class="toolbar">
 		<div class="button-div" id="toolbar">

        <!--TRANSLATE-->
		<button id="translate" class="toolbar-button flag">
				<img loading="lazy" id="flag" draggable="false" src="images/english-flag.png">
				<?php tooltip("अनुवाद") ?>
			</button>

            <!--HOME-->
 			<button onclick="parent.location.href = 'home';"  id="toolbar-home" class="toolbar-button">
 				<img loading="lazy" draggable="false" src="images/home.png"   >
				<?php tooltip("Home") ?>
 			</button>

            <!--LIBRARY-->
			<button onclick="LOOMA.setStore('libraryScroll', 0, 'session');
			                 LOOMA.clearStore('library-search',     'session');
                             parent.location.href = 'library?fp=../content/';"
                    id="toolbar-library" class="toolbar-button ">
				<!-- call looma-library.php with path to starting folder of the Library. -->
				<img loading="lazy" draggable="false" src="images/library.png"  height= "80%" >
				<?php tooltip("Library") ?>
			</button>

            <!--LBRARY SEARCH-->
			<button onclick="LOOMA.setStore('libraryScroll', 0, 'session');
			                 LOOMA.clearStore('library-search',     'session');
                             parent.location.href = 'search?fp=../content/';"
                    id="toolbar-search" class="toolbar-button ">
				<!-- search looma-library.php with path to starting folder of the Library. -->
				<img loading="lazy" draggable="false" src="images/search.png"  height= "80%" >
				<?php tooltip("Search") ?>
			</button>

            <!--DICTIONARY-->
			<button onclick="parent.location.href = 'dictionary';"
                    id="toolbar-dictionary" class="toolbar-button ">
				<img loading="lazy" draggable="false" src="images/dictionary.png"  height= "80%" >
				<?php tooltip("Dictionary") ?>
			</button>

            <!--PAINT-->
			<button onclick="parent.location.href = 'paint?ModPagespeed=off';"
                    id="toolbar-paint" class="toolbar-button ">
				<img loading="lazy" draggable="false" src="images/paint.png"   >
				<?php tooltip("Paint") ?>
			</button>

            <!--CLOCK-->
            <button onclick="parent.location.href = 'clock';"
                    id="toolbar-clock" class="toolbar-button ">
                <img loading="lazy" draggable="false" src="images/clock.png"   >
                <?php tooltip("Clocks") ?>
            </button>

            <!--MAPS-->
            <button onclick="parent.location.href = 'maps';"
                    id="toolbar-maps" class="toolbar-button ">
                <img loading="lazy" draggable="false" src="images/maps.png"   >
                <?php tooltip("Maps") ?>
            </button>

            <!--HISTORIES-->
            <button onclick="parent.location.href = 'histories';"
                    id="toolbar-histories" class="toolbar-button ">
                <img loading="lazy" draggable="false" src="images/history.png"   >
                <?php tooltip("History") ?>
            </button>

            <!--GAMES-->
			<button onclick="parent.location.href = 'games';"
                    id="toolbar-games" class="toolbar-button ">
				<img loading="lazy" draggable="false" src="images/games.png"   >
				<?php tooltip("Games") ?>
			</button>

            <!--CALCULATOR-->
			<button onclick="parent.location.href = 'calculator';"
                    id="toolbar-calculator" class="toolbar-button ">
				<img loading="lazy" draggable="false" src="images/calc.png"   >
				<?php tooltip("Calculator") ?>
			</button>

            <!--WEB-->
			<button onclick="parent.location.href = 'web';"
                    id="toolbar-web" class="toolbar-button ">
				<img loading="lazy" draggable="false" src="images/web.png"   >
				<?php tooltip("Web") ?>
			</button>


            <!-- EDIT MADE  on line 20 to include video recorder button on the toolbar w/ image -->
            <!--VIDEO RECORDER-->
        <!--
            <button hidden onclick="parent.location.href = 'video-recorder';"
                    id="toolbar-record" class="toolbar-button">
                <img draggable="false" src="images/video_record.png"   >
                <?php tooltip("Home") ?>
            </button>
        -->

            <!--SETTINGS-->
			<button onclick="parent.location.href = 'settings';"
                    id="toolbar-settings" class="toolbar-button ">
				<img loading="lazy" draggable="false" src="images/settings.png"   >
				<?php tooltip("Tools") ?>
			</button>

            <!--INFO-->
			<button onclick="parent.location.href = 'info';"
                    id="toolbar-info" class="toolbar-button ">
				<img loading="lazy" draggable="false" src="images/info.png"   >
				<?php tooltip("Info") ?>
			</button>

            <!--BACK ARROW-->
			<button  class="toolbar-button back-button">
				<img loading="lazy" draggable="false" src="images/back-arrow.png"   >
				<?php tooltip("Back") ?>
			</button>

            <!--FORWARD-->
			<!-- <button  class="toolbar-button" onclick="parent.history.forward()">
				<img draggable="false" src="images/forward-arrow.png" width = "60px"  ></button>   -->
        </div>

		<div id="logo-div">
			<span class="logo">
                <!-- <span class="english-keyword" draggable="false"> Supported by </span>
                <span class="native-keyword" draggable="false"> सहयोग कर्ता </span> -->
                <img id="toolbar-logo-CEHRD" src="images/logos/CEHRD-logo.png">
                <img  class="toolbar-logo english-keyword"  src="images/logos/Looma-english-amanda 3x1.png" >
			    <img  class="toolbar-logo native-keyword" hidden draggable="false" src="images/logos/Looma-nepali-amanda 3x1.png" >
      		</span>

			<span id="datetime"></span>

            <!-- NOTE: display AMAZON  logo is we can detect that this instance of looma is running on AWS
            <span id="amazon"><img src="images/logos/amazon.png"></span>
            -->
		</div>

        <img id="padlock"
             draggable="false"
             src="<?php echo loggedIn() ? "/images/padlock-open.png" : "/images/padlock-closed.png"; ?>" >

        <p id="login-id" ><?php if (loggedIn()) echo "You are logged in as '" . $_COOKIE['login'] ."'" ?></p>

    </div>

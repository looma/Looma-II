
    <link rel="stylesheet" href="css/looma-toolbar.css">

    <div id="toolbar-container" class="toolbar">
 		<div class="button-div" id="toolbar">

			<button id="translate" class="toolbar-button flag">
				<img id="flag" draggable="false" src="images/english-flag.png">
				<?php tooltip("अनुवाद") ?>
			</button>

 			<button onclick="parent.location.href = 'looma-home.php';" class="toolbar-button next-prev">
 				<img draggable="false" src="images/home.png"  height = "80%" >
				<?php tooltip("Home") ?>
 			</button>

			<button onclick="LOOMA.setStore('libraryScroll', 0, 'session');
			                 LOOMA.clearStore('searchForm',     'session');
                             parent.location.href = 'looma-library-search.php?fp=../content/';" class="toolbar-button ">
				<!-- call looma-library.php with path to starting folder of the Library. -->
				<img draggable="false" src="images/library.png"  height= "80%" >
				<?php tooltip("Library") ?>
			</button>

			<button onclick="parent.location.href = 'looma-dictionary.php';" class="toolbar-button ">
				<img draggable="false" src="images/dictionary.png"  height= "80%" >
				<?php tooltip("Dictionary") ?>
			</button>

			<button onclick="parent.location.href = 'looma-paint.php?ModPagespeed=off';" class="toolbar-button ">
				<img draggable="false" src="images/paint.png" height = "80%"  >
				<?php tooltip("Paint") ?>
			</button>

            <button onclick="parent.location.href = 'looma-clock.php';" class="toolbar-button ">
                <img draggable="false" src="images/clock.png"  height = "80%" >
                <?php tooltip("Clocks") ?>
            </button>

            <button onclick="parent.location.href = 'looma-maps.php';" class="toolbar-button ">
                <img draggable="false" src="images/maps.png"  height = "80%" >
                <?php tooltip("Maps") ?>
            </button>

            <button onclick="parent.location.href = 'looma-histories.php';" class="toolbar-button ">
                <img draggable="false" src="images/history.png"  height = "80%" >
                <?php tooltip("History") ?>
            </button>

			<button onclick="parent.location.href = 'looma-games.php';" class="toolbar-button ">
				<img draggable="false" src="images/games.png"  height = "80%" >
				<?php tooltip("Games") ?>
			</button>

			<button onclick="parent.location.href = 'looma-calculator.php';" class="toolbar-button ">
				<img draggable="false" src="images/calc.png"  height = "80%" >
				<?php tooltip("Calculator") ?>
			</button>

			<button onclick="parent.location.href = 'looma-web.php';" class="toolbar-button ">
				<img draggable="false" src="images/web.png"  height = "80%" >
				<?php tooltip("Web") ?>
			</button>

			<button onclick="parent.location.href = 'looma-settings.php';" class="toolbar-button ">
				<img draggable="false" src="images/settings.png"  height = "80%" >
				<?php tooltip("Tools") ?>
			</button>

			<button onclick="parent.location.href = 'looma-info.php';" class="toolbar-button ">
				<img draggable="false" src="images/info.png"  height = "80%" >
				<?php tooltip("Info") ?>
			</button>

			<button  class="toolbar-button back-button" onclick="parent.history.back();">
				<img draggable="false" src="images/back-arrow.png" height = "80%"  >
				<?php tooltip("Back") ?>
			</button>

			<!-- <button  class="toolbar-button next-prev" onclick="parent.history.forward()">
				<img draggable="false" src="images/forward-arrow.png" width = "60px" height = "80%" ></button>   -->
        </div>

		<div id="logo-div">
			<!-- DATETIME ready to turn on. needs to be positioned with CSS-->
			<span class="logo">
			    <img  id="logo"   draggable="false" src="images/logos/LoomaLogoTransparent.png" >
      		</span>
            <br>
			<span id="datetime"></span>
		</div>



        <img id="padlock"
             draggable="false"
             src="  <?php echo loggedIn() ? "images/padlock-open.png" : "images/padlock-closed.png"; ?>" >

        <p id="login-id" ><?php if (loggedIn()) echo "You are logged in as '" . $_COOKIE['login'] ."'" ?></p>

    </div>

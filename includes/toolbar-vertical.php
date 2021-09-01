
    <link rel="stylesheet" href="css/looma-toolbar.css">

    <div id="toolbar-container-vertical" class="toolbar">
 		<div class="button-div" id="toolbar-vertical">

            <!--TRANSLATE-->
            <button id="translate" class="toolbar-button-vertical flag-vertical">
                <img id="flag" draggable="false" src="images/english-flag.png">
                <?php tooltip('अनुवाद');?>
            </button>
    
           <!--HOME-->
           <button onclick="parent.location.href = 'looma-home.php';"   id="toolbar-home" class="toolbar-button-vertical">
                <img draggable="false" src="images/home.png"  height = "70%" >
                <?php tooltip('Home');?>
            </button>
    
            <!--LIBRARY-->
           <button onclick="LOOMA.setStore('libraryScroll', 0, 'session');
                             LOOMA.setStore('library-search',    0, 'session');
                             parent.location.href = 'looma-library.php?fp=../content/';"
                   id="toolbar-library" class="toolbar-button-vertical ">
                <!-- call looma-library.php with path to starting folder of the Library. -->
                <img draggable="false" src="images/library.png"  height= "70%" >
                <?php tooltip('Library');?>
            </button>
    
           <!--SEARCH-->
            <button onclick="LOOMA.setStore('libraryScroll', 0, 'session');
                             LOOMA.clearStore('library-search',     'session');
                             parent.location.href = 'looma-library-search.php?fp=../content/';"
                    id="toolbar-search" class="toolbar-button-vertical ">
                <!-- search looma-library.php with path to starting folder of the Library. -->
				<img draggable="false" src="images/search.png"  height= "70%" >
                <?php tooltip("Search") ?>
            </button>
    
            <!--DICTIONARY-->
           <button onclick="parent.location.href = 'looma-dictionary.php';"
                   id="toolbar-dictionary" class="toolbar-button-vertical ">
                <img draggable="false" src="images/dictionary.png"  height= "70%" >
                <?php tooltip('Dictionary');?>
            </button>
    
           <!--PAINT-->
            <button onclick="parent.location.href = 'looma-paint.php?ModPagespeed=off';"
                    id="toolbar-paint" class="toolbar-button-vertical ">
                <img draggable="false" src="images/paint.png" height = "70%"  >
                <?php tooltip('Paint');?>
            </button>
    
           <!--CLOCK-->
            <button onclick="parent.location.href = 'looma-clock.php';"
                    id="toolbar-clock" class="toolbar-button-vertical ">
                <img draggable="false" src="images/clock.png"  height = "80%" >
                <?php tooltip("Clocks") ?>
            </button>
    
           <!--MAPS-->
            <button onclick="parent.location.href = 'looma-maps.php';"
                    id="toolbar-maps" class="toolbar-button-vertical ">
                <img draggable="false" src="images/maps.png"  height = "70%" >
                <?php tooltip('Maps');?>
            </button>
    
            <!--HISTORIES-->
           <button onclick="parent.location.href = 'looma-library.php?fp=../content/timelines/';"
                   id="toolbar-histories" class="toolbar-button-vertical ">
                <img draggable="false" src="images/history.png"  height = "70%" >
                <?php tooltip("History") ?>
            </button>
    
           <!--GAMES-->
            <button onclick="parent.location.href = 'looma-games.php';"
                    id="toolbar-games" class="toolbar-button-vertical ">
                <img draggable="false" src="images/games.png"  height = "70%" >
                <?php tooltip('Games');?>
            </button>
    
           <!--CACULATOR-->
            <button onclick="parent.location.href = 'looma-calculator.php';"
                    id="toolbar-calculator" class="toolbar-button-vertical ">
                <img draggable="false" src="images/calc.png"  height = "70%" >
                <?php tooltip('Calculator');?>
            </button>
    
           <!--WEB-->
            <button onclick="parent.location.href = 'looma-web.php';"
                    id="toolbar-web" class="toolbar-button-vertical ">
                <img draggable="false" src="images/web.png"  height = "70%" >
                <?php tooltip('Web');?>
            </button>
    
            <!--SETTINGS-->
           <!--
            <button onclick="parent.location.href = 'looma-settings.php';"
                id="toolbar-settings" class="toolbar-button-vertical ">
                <img draggable="false" src="images/settings.png"  height = "70%" >
                <?php tooltip('Tools');?>
            </button>
            -->
    
           <!--INFO-->
            <button onclick="parent.location.href = 'looma-info.php';"
                    id="toolbar-info" class="toolbar-button-vertical ">
                <img draggable="false" src="images/info.png"  height = "70%" >
                <?php tooltip('Info');?>
            </button>
    
            <!--BACK-->
           <button  class="toolbar-button-vertical back-button">
                <img draggable="false" src="images/back-arrow.png" height = "70%"  >
                <?php tooltip('Back');?>
            </button>
        </div>

        <div id="logo-div">
            <!-- DATETIME ready to turn on. needs to be positioned with CSS-->
            <span class="logo">
			      <span class="english-keyword" draggable="false"> Supported by </span>
                <span class="native-keyword" draggable="false"> सहयोग कर्ता </span>
                <img  class="toolbar-logo vertical english-keyword" draggable="false" src="images/logos/Looma-english-amanda 3x1.png" >
			    <img  class="toolbar-logo vertical native-keyword" hidden draggable="false" src="images/logos/Looma-nepali-amanda 3x1.png" >
      		</span>
            <br>
            <span id="datetime"></span>
        </div>
    </div>

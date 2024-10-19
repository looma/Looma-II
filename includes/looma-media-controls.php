
    <link rel="stylesheet" type="text/css" href="css/looma-media-controls.css">

    <div id='media-controls' class='media-controls'>

        <div class='time title'>
            <span id='elapsedtime'></span>
            <span>  /  </span>
            <span id='totaltime'></span>
        </div>

        <button type='button' id='video-playpause' class='media play-pause'>
            <?php keyword('Play/Pause') ?>
        </button>
        <input type='range' id='video-seek-bar' class='video seek-bar' value='0' >

        <br>
        <button type='button' class='media mute'>
            <?php keyword('Volume') ?>
        </button>
        <input type='range' id='volume' class='video volume-bar' min='0' max='1' step='0.1' value='0.5' >

    </div>


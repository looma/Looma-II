<?php
//function isLoggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);};
require_once('includes/looma-isloggedin.php');

// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = loggedIn(); if (!$loggedin) header('Location: looma-login.php');
error_log("Starting Reading Settings session. logged in as: " . $loggedin);
?>


<?php $page_title = 'Looma Reading Settings';
require_once ('includes/header.php');
define ("CLASSES", 8);

// Renders the per-engine, per-language speech-speed dropdown. Speed is now
// chosen separately for English and Nepali on each engine (the matching voice
// sits right above it), so a teacher can, say, slow Nepali down while keeping
// English at normal pace. Default 2/3 — Looma's long-standing speed for Nepal.
function ttsRateSelect($id) {
    $opts = array('0.50' => '1/2', '0.67' => '2/3', '1' => '1', '1.5' => '1.5', '2' => '2');
    echo '<select id="' . $id . '" class="tts-rate-select">';
    foreach ($opts as $val => $label) {
        $sel = ($val === '0.67') ? ' selected' : '';
        echo '<option value="' . $val . '"' . $sel . '>' . $label . '</option>';
    }
    echo '</select>';
}
?>

<link rel="stylesheet" href="css/looma.css">
<link rel="stylesheet" href="css/looma-test-speech.css?v=<?php echo @filemtime('css/looma-test-speech.css') ?: time(); ?>">

</head>

<body>
    <div id="main-container-horizontal">
      <div id="tts-test">

        <h1 class="tts-heading">Reading Settings</h1>

        <!-- phrase to speak — used to try the settings out -->
        <div class="tts-row">
            <span class="tts-label">Enter a phrase to speak:</span>
            <input type="text" id="text" value="Hello this is Looma">
        </div>

        <!-- One column per text-to-speech engine. Every column has the same
             rows — Speak button, English voice + English speed, Nepali voice +
             Nepali speed, default checkbox — so the controls line up across all
             engines. Speed is per engine AND per language (higher is faster). -->
        <div class="tts-engine-group">

            <div class="tts-engine">
                <button id="piper" type="button" class="tts-engine-button">Speak with Piper</button>
                <div class="tts-voice-field">
                    <label for="piper-voice-en">English voice</label>
                    <select id="piper-voice-en" class="tts-voice-select">
                        <option value="en_US-amy-low.onnx" selected>English (US female)</option>
                    </select>
                </div>
                <div class="tts-rate-field">
                    <label for="piper-rate-en">English speed</label>
                    <?php ttsRateSelect('piper-rate-en'); ?>
                </div>
                <div class="tts-voice-field">
                    <label for="piper-voice-np">Nepali voice</label>
                    <select id="piper-voice-np" class="tts-voice-select">
                        <option value="ne_NP-google-x_low.onnx" selected>Nepali (google)</option>
                    </select>
                </div>
                <div class="tts-rate-field">
                    <label for="piper-rate-np">Nepali speed</label>
                    <?php ttsRateSelect('piper-rate-np'); ?>
                </div>
                <label class="tts-default-label">
                    <input type="checkbox" class="tts-default" id="piper-default" data-engine="piper" checked>
                    <span>Default for reading text selections</span>
                </label>
            </div>

            <div class="tts-engine">
                <button id="responsivevoice" type="button" class="tts-engine-button">Speak with ResponsiveVoice</button>
                <div class="tts-voice-field">
                    <label for="responsivevoice-voice-en">English voice</label>
                    <select id="responsivevoice-voice-en" class="tts-voice-select">
                        <option value="UK English Female" selected>UK English Female</option>
                        <option value="UK English Male">UK English Male</option>
                        <option value="US English Female">US English Female</option>
                        <option value="US English Male">US English Male</option>
                    </select>
                </div>
                <div class="tts-rate-field">
                    <label for="responsivevoice-rate-en">English speed</label>
                    <?php ttsRateSelect('responsivevoice-rate-en'); ?>
                </div>
                <div class="tts-voice-field">
                    <label for="responsivevoice-voice-np">Nepali voice</label>
                    <select id="responsivevoice-voice-np" class="tts-voice-select">
                        <option value="Hindi Female" selected>Hindi Female (closest to Nepali)</option>
                        <option value="Hindi Male">Hindi Male</option>
                    </select>
                </div>
                <div class="tts-rate-field">
                    <label for="responsivevoice-rate-np">Nepali speed</label>
                    <?php ttsRateSelect('responsivevoice-rate-np'); ?>
                </div>
                <label class="tts-default-label">
                    <input type="checkbox" class="tts-default" id="responsivevoice-default" data-engine="responsivevoice">
                    <span>Default for reading text selections</span>
                </label>
                <!-- Filled in by looma-test-speech.js when ResponsiveVoice cannot
                     be reached, so the disabled controls explain themselves. -->
                <p id="responsivevoice-unavailable-note" class="tts-unavailable-note"></p>
            </div>

            <!-- Mimic and Browser Speech (speechSynthesis) were removed. The two
                 remaining engines are Piper (local/offline — always the default)
                 and ResponsiveVoice (cloud — selectable only with internet). -->

        </div>

      </div>
    </div>
    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>

    <script src="js/looma-test-speech.js?v=<?php echo @filemtime('js/looma-test-speech.js') ?: time(); ?>"></script>

</body>

</html>

<?php
/*
Filename: looma-databse-utilities.php
Programmer : Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: Nov 2019
Revision: 1.0
*/
    if ( isset($_REQUEST["cmd"])) { $cmd =  $_REQUEST["cmd"];};
    if ($cmd === 'halt') { echo "halting"; exec ('pkill -n chromium'); return;} // or try shell_exec('/usr/local/bin/looma-halt
    if ($cmd === 'shutdown') { echo "shutting down"; exec ('shutdown'); return;}     // or try shell_exec('/usr/local/bin/looma-shutdown

    echo "executing " . $cmd . "\n";
    exec($cmd, $output, $return);
    print_r($output);
    echo "\n";
    echo "error: " . $return . "\n";
    return;
?>

<?php
require_once('includes/looma-isloggedin.php');
require_once('vendor/autoload.php');

// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = loggedIn();
if (!$loggedin || loginLevel() !== 'exec') header('Location: looma-login.php');
error_log("Starting Import Content session. logged in as: " . $loggedin);

// calling parameter 'cmd' can be 'nwspeed' or 'update
if (isset($_REQUEST['cmd'])) $cmd = $_REQUEST['cmd']; else $cmd = null;

// calling parameter 'option' can be 'code' or 'code and content'
if (isset($_REQUEST['option'])) $option =  $_REQUEST['option'];
else $option = "";

// 'update' cmd can return:
//      update completed
//      code and content are up to date
//      updated failed
//      no internet connection
//      sshpass command not present

function sshAWS ($cmd) {
    $code = null; $output = null;

    $fullcmd = "ssh -i /var/www/.ssh/id_58191   58191@usw-s008.rsync.net " . $cmd;
    return exec($fullcmd, $output, $code);
}; // end sshAWS()

function checktimestamp ($dir) {
    global $latest, $current, $rsyncURL, $username, $password;

    $current_file = "/var/www/html/" . $dir . "/archivetimestamp.txt";  //Linux
    // MAC: $current_file = "/usr/local/var/www/" . $dir . "/archivetimestamp.txt";  //MAC
    if (file_exists($current_file))
         $current = trim(file_get_contents($current_file)); else $current = "";

    $cmd = " cat " . $dir . "/archivetimestamp.txt";
    $latest = trim(sshAWS($cmd));

    echo "checking timestamp for dir = $dir: current is %$current%; latest is %$latest%<br>";

    return ($current === $latest);  // return TRUE is this $dir is uptodate
}  //  end checktimestamp()

///// main code ///////
if ( $cmd === 'update' ) {
    $latest =  "";
    $current = "";
    $contentupdated = false;
    $codeupdated    = false;
    $rsyncURL = "usw-s008.rsync.net";
    $username = "58191";
    $password = "looma";

    if (sshAWS("pwd") != 0) exit('Accessing Looma archive site failed');

   // $rsynccommand = "sshpass -p looma rsync -azO --stats --perms --chmod=D777,F777 --chown=looma:looma --exclude '.[!.]' --delete --delete-excluded --e 'ssh' ";
    //$rsynccommand = "rsync -azO --stats --perms --chmod=D777,F777 --chown=looma:looma --exclude '.[!.]' --delete --delete-excluded -e 'ssh' ";
    //NOTE: --chmod and --chown cause the RSYNC to fail because the apache user "www-data" doesnt have permission to exec them.
    //NOTE: -e 'ssh' doesnt seem to be necessary
    $rsynccommand = "rsync -azO -vvv  --exclude='.??*' --delete -e 'ssh -i /var/www/.ssh/id_58191'   ";

//////// update CODE ///////////
    $updated = checktimestamp("Looma");

    //if ($updated) echo "updated"; else echo "not updated";exit;

   //     $dryrun = " --dry-run ";
    $dryrun = " ";
     //   echo "dryrun is $dryrun <br>";
        
    if ( ! $updated ) {
        $shellcommand = $rsynccommand . " " . $dryrun . " " . $rsyncURL . "@" . $username . ":../Looma/ /var/www/html/Looma";
        //$shellcommand = $rsynccommand . " " . $username . "@" . $rsyncURL . ":test_folder/    /tmp/test_folder";

        $code = 0;
       
        echo "SHELLCOMMAND is $shellcommand <br>";

        $result = shell_exec($shellcommand);

        //echo "result of rsync is " . $result;exit;

        if ( $result != 0 ) {
            echo "ERROR: RSYNC command failed to update Looma code [with: ". $code. "]<br>";
            echo "result is " . $result . "<br>";
            //print_r($output);
            exit;
        } else {
            $codeupdated = true;

            shell_exec("echo $latest > /var/www/html/Looma/archivetimestamp.txt");
            shell_exec("sudo chmod 666 /var/www/html/Looma/archivetimestamp.txt");

echo "writing %$latest% to archivetimestamp.txt"; exit;

            //shell_exec('mongo --eval "db.dropDatabase();" looma');
            //shell_exec('mongorestore --quiet --db looma "/var/www/html/Looma/mongo-dump/dump/looma/"');
        }
    } else echo "Code files are up-to-date<br>";

//////// update CONTENT ///////////
    if ( $option === "code and content" ) {
        $updated = checktimestamp('content');
        // echo "result of checktimestamp(content) is $updated <br>";

        if ( ! $updated ) {
          //  $shellcommand = $rsynccommand . " --dry-run --size-only " . $source. ":../content/ /var/www/html/content";
            $shellcommand = $rsynccommand . " " . $dryrun . " --size-only " . $rsyncURL . "@" . $username . ":../Looma/ /var/www/html/Looma";

           // $shellcommand = "sshpass -p " . $password . " " . $rsynccommand . " " . $username . "@" . $rsyncURL . ":content/test_folder/    /tmp/test_folder";

            $code = 0;
            echo "shellcommand is $shellcommand <br>";

            //exec($shellcommand, $output, $code);
            if ( $code != 0 ) {
                echo "ERROR: RSYNC command failed to update Looma content";
                exit;
            } else {
                $contentupdated = true;
                shell_exec("echo $latest > /var/www/html/content/archivetimestamp.txt");
                shell_exec("sudo chmod 666 /var/www/html/content/archivetimestamp.txt");
            }
        } else echo "Content files are up-to-date";
    };

    if ($codeupdated)    echo "Updated Looma code<br>";
    if ($contentupdated) echo "Updated Looma content<br>";
    //$ssh->reset();
    exit;
}  //  end UPDATE command

else if ( $cmd === 'nwspeed' ) {
    //Checking network speed
    $shellcommand = 'speedtest  --no-upload --secure | grep Download:';
    $result = shell_exec($shellcommand);
    echo $result;
    exit;
    }  // end NWSPEED cmd
else {
    echo "ERROR: no command given";
    exit;
}
?>

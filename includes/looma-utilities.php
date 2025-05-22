<?php

///////////////////
/// functions defined:
/// prefix(ch_id)
/// ch_idClass    [php version of LOOMA.ch_idClass() in looma-utilities.js]
/// ch_idSubject  [php version of LOOMA.ch_idSubject() in looma-utilities.js]
/// isHTML
/// isEpaath
/// folderName
/// thumbnail
/// folderThumbnail
/// makeActivityButton
/// downloadButton
/// salt
/// encrypt
/// redirect_user
/// getFPandFN
/// //////////////////

$ch_idREGEX =  "/^([1-9]|10|11|12)(M|N|S|SF|SS|EN|H|V)([0-9][0-9])(\.[0-9][0-9])?$/";
$subjects = array (
    "M"  => "Math",
    "EN" => "English",
    "N"  => "Nepali",
    "S"  => "Science",
    "SF" => "Serafero",
    "SS" => "SocialStudies",
    "H"  => "Health",
    "V"  => "Vocation",
);

function ch_idToClass ($ch_id) {
    preg_match ( "/^([1-9]|10|11|12)(M|N|S|SF|SS|EN|H|V)([0-9][0-9])(\.[0-9][0-9])?$/" , $ch_id , $matches );
    return "Class" . $matches[1];
};

function ch_idToSubject ($ch_id) {
    global $subjects;
    preg_match ( "/^([1-9]|10|11|12)(M|N|S|SF|SS|EN|H|V)([0-9][0-9])(\.[0-9][0-9])?$/" , $ch_id , $matches );
    return $subjects[ $matches[2] ];
};

 $icons = array (
     "pdf" => "images/pdf.png",
     "jpeg" => "images/picture.png",
     "jpg" => "images/picture.png",
     "png" => "images/picture.png",
     "image" => "images/picture.png",
     "game" => "images/games.png",
     "history" => "images/history.png",
     "lesson" => "images/lesson.png",
     "video" => "images/video.png",
     "mp4" => "images/video.png",
     "mov" => "images/video.png",
     "mp3" => "images/audio.png",
     "audio" => "images/audio.png",
     "book" => "images/book.png",
     "html" => "images/html.png",
     "EP" => "images/ole.png",
     "ep" => "images/ole.png",
     "epaath" => "images/ole.png",
     "khan" => "images/logos/khan leaf.jpeg",
     "map" => "images/maps.png",
     "slideshow" => "images/slideshow.png",
     "text" => "images/textfile.png",
     "textfile" => "images/textfile.png",
     "looma" => "images/LoomaLogo_small.png"
 );

/****************************/
/*****  prefix   ********/
/****************************/

        /*** BUG? should return $matches[1] . $matches[2]   ***/
function prefix ($ch_id) { // extract textbook prefix from ch_id
    preg_match("/^(([1-9]|10)(Ma|M|N|Sa|S|SSa|SS|EN|H|V))[0-9]/", $ch_id, $matches);
    return (isset($matches[1]) && $matches[1]) ? $matches[1] : null;
}

/****************************/
/*****  ch_idClass   ********/    //^^^^ Not currently used ^^^^
/****************************/
function ch_idClass($ch_id) {
     if (($ch_id) && preg_match ( "/^([1-9]|10)(Ma|M|N|Sa|S|SSa|SS|EN|H|V)([0-9][0-9])(\.[0-9][0-9])?$/" , $ch_id , $matches ))
            return $matches[1];
     else return null;
}  //end function ch_idClass()

/****************************/
/*****  ch_idSubject   ******/   //^^^^ Not currently used ^^^^
/****************************/
function ch_idSubject($ch_id) {
    if (($ch_id) && preg_match ( "/^([1-9]|10)(Ma|M|N|Sa|S|SSa|SS|EN|H|V)([0-9][0-9])(\.[0-9][0-9])?$/" , $ch_id , $matches ))
        return $matches[2];
    else return null;
}  //end function ch_idSubject()


/**********************/
/*****  isHTML   ******/
/**********************/
function isHTML($fp) {
    if ( $fp != '../content/Khan' &&
        file_exists($fp . "/index.html") &&
        !isEpaath($fp) &&
        !preg_match('/W3Schools/i', $fp))
        return true;
    else return false;
}  //end function isHTML


/**********************/
/**** isEpaath   ******/      //^^^^ Not currently used ^^^^
/**********************/
function isEpaath($fp) {
        if (substr($fp, -7, 7) == "epaath/") return true;
        else return false;
    } //end function isEpaath


/**********************/
/****** folderName*****/
/**********************/
function folderName ($path) {
        // strip trailing '/' then get the last dir name, by finding the remaining last '/' and substring
        $a = explode("/", $path);
        if (count($a) > 1) return $a[count($a) - 2]; else return "";
    }  //end FOLDERNAME()


/**********************/
/***** thumbnail ******/
/**********************/
/*
 function thumbnail ($fn) {
            //given a CONTENT filename, generate the corresponding THUMBNAIL filename
            //find the last '.' in the filename, strip off the extension, and append '_thumb.jpg'
            //example: input 'aaa.bbb.mp4' returns 'aaa.bbb_thumb.jpg' - this is the looma standard for naming THUMBNAILS
                $dot = strrpos($fn, ".");  //strrpos finds the LAST occurrence
                if ( $dot ) { return substr($fn, 0, $dot) . "_thumb.jpg";}
                else return "";
      } //end function THUMBNAIL
*/

function thumbnail ($file, $path, $type) {

    //echo "file is " . $file . '<br>';
    //echo "path is " . $path . '<br>';
    //echo "type is " . $type . '<br>';

    $src = "";

    $dot = $file ? strrpos($file, ".") : "";  //strrpos finds the LAST occurrence
    if ( $dot ) { $src = $path . substr($file, 0, $dot) . "_thumb.jpg";}

    //echo "thumb is " . $src . '<br>';
    //if (file_exists($src)) echo "file exists"; else echo "file does not exist";

    // if no specific thumbnail, use folder's thumbnail
    if (!file_exists($src)) $src = $path . "thumbnail.png";

    // if still no thumbnail, use filetype's thumbnail
    if (!file_exists($src)) {
         if ($type == 'text' || $type === 'text-template')    $src = "images/textfile.png";
    else if ($type == 'game')       $src = "images/game.png";
    else if ($type == 'pdf')        $src = "images/pdf.png";
    else if ($type == 'EP')         $src = "images/logos/ole-nepal.jpg";
    else if (in_array($type, ['mp4','m4v','mp5','mov','video']))  $src = "images/video.png";
    else if (in_array($type, ['jpg','jpeg','png','gif','image'])) $src = "images/picture.png";
    else if (in_array($type, ['mp3','m4a','audio']))              $src = "images/audio.png";
    else if ($type == 'slideshow')  $src = "images/play-slideshow-icon.png";
    else if ($type == 'lesson')     $src = "images/lesson.png";
    else if ($type == 'looma')      $src = "images/LoomaLogo.png";
    else $src = "";
    };

   // $src = htmlspecialchars($src);

    //echo "returned thumb src is " . $src;

    return $src;
}  // end thumbnail()

/**********************/
/**** folderThumbnail   ***/
/**********************/
function folderThumbnail ($fp) {  //for directories, look for filename "thumbnail.png" for a thumbnail representing the contents
    if (file_exists($fp . "/thumbnail.png")) {
        return "<img loading='lazy' alt='' src='$fp/thumbnail.png' >"; }
    else return "<img loading='lazy' alt='' src='images/folder.png' >";
} //end function thumbnail

function displayName($filename, $dn, $ndn, $color) {

    //echo "DN is " . $dn . "**";
    //echo "NDN is " . $ndn . "**";

    if ($dn && $ndn) {
        echo "<span class='english-keyword'>"
            . $dn .
            "<span class='xlat'>" . $ndn . "</span>" .
            "</span>";
        echo "<span class='native-keyword' >"
            . $ndn .
            "<span class='xlat'>" . $dn . "</span>" .
            "</span>";
    } else if ($dn) echo "<span class='name' style='color:" . $color . "'>" . $dn . "</span>";
      else if ($ndn) echo "<span class='name'>" . $ndn . "</span>";
      else echo "<span class='name'>" . $filename . "</span>";
}  //end displayName()

function alphabetize_by_dn ($array) {
    // sort the list of dirs by DN
    usort($array, function ($a, $b) {
        return strcasecmp(
            isset($a['dn']) ? $a['dn'] : "",
            isset($b['dn']) ? $b['dn'] : ""); });
    return $array;
}

function natksort($array) {
    // Like ksort but uses natural sort instead
    $keys = array_keys($array);
    natcasesort($keys);
    foreach ($keys as $k) $new_array[$k] = $array[$k];
    return $new_array;
} //end natksort()

/*********************************/
/******** makeInlineActivityButton *****/
/*********************************/

function makeInlineActivityButton($activity)
{   global $playLang;

    //NOTE: this function has not been tested"
    //function check($x) {return isset(($activity['native'])) ? ($activity['native']) : null;};
            echo "<button class='activity  img' ";
                echo "data-dn='' data-ft='inline' ";
                echo "data-html= '"   . htmlentities($activity['html'], ENT_QUOTES) . "' ";
                echo "data-nepali= '"   . htmlentities((isset($activity['nepali']) ? ($activity['nepali']) : ""), ENT_QUOTES) . "' ";
                echo "data-lang = "  . $playLang ;
            echo ">";
            echo '<img alt="" src="' . 'images/textfile.png' . '">';
            echo "<span>" . "" . "</span></button>";
}; //end makeInlineActivityButton()

function makeMapButton($id, $thumb, $dn) {
    global $icons;

    echo "<a href='" . "map?id=" . $id . "'>";

    echo "<button class='map  img'>";
    //text and tooltip for BUTTON
    echo         "<img src='" . $thumb . "'>";
    echo "<span class='name'>" . $dn . "</span>";
    echo "<img class='icon' src='" . $icons['map'] . "'>";
    //finish BUTTON
    echo "</button></a>";
}  //end makeMapButton()

/*********************************/
/******** makeInlineActivityButton *****/
/*********************************/

// NOTE: instead of this long list of args, the fn should take one param - an assoc array/object with all the activity's attributes

function makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $ole_id, $url, $pg, $zoom, $grade, $epversion, $nfn, $npg, $prefix,$lang) {

    global $icons;
	//NOTE: would be better to call this with an object with fields ft, fp, fn, etc. smaller arglist and fewer null parameters

	    // makes an ACTIVITY button (for looma-library, looma-activities,
        //          looma-lessons, looma-chapters, looma-wiki, looma-lesson-present,looma-play-slideshow,looma-histories, etc)
	    // some parameters are optional for some filetypes
	    //    $ft - filetype, $fp - path to file, $fn - filename, $dn - display name, $ndn - nepali display name, $thumb - thumbnail file name
	    //    $ch_id - chapter ID, $mongo_id - mongoDB id,
        //     for ePAATH: $ole_id, $url, $grade, $epversion
        //     for PDF: $pg - page number, $zoom - initial zoom level

	    //parameters used in buttons for various filetypes
	    //VIDEO            $ft, $fn, $fp, $dn
	    //IMAGE            $ft, $fn, $fp, $dn
	    //AUDIO            $ft, $fn, $fp, $dn
	    //PDF              $ft, $fn, $fp, $dn, $pg, $zoom
	    //SLIDESHOW        $ft, $id (or $fp)       [$thumb?]
	    //EDITED VIDEO     $ft, $fn, $fp, $dn, $id [$thumb?]
	    //ePAATH           $ft, $fn, $fp, $dn
	    //LOOMA
        //HTML
	    //VOCAB
	    //LESSON PLAN

		if (!$fp) switch ($ft) { //if $fp is not specified, use the default content folder for this $ft

			case "video":
            case "mp4":
            case "MP4":
            case "mp5":
            case "m4v":
			case "mov": $fp = '../content/videos/'; break;

            case "image":
            case "jpg":
            case "jpeg":
            case "png":
            case "gif": $fp = '../content/pictures/';	break;

            case "audio":
            case "m4a":
			case "mp3": $fp = '../content/audio/'; break;

			case "pdf":	$fp = '../content/pdfs/'; break;

            case "slideshow": $fp = '../content/slideshows/'; break;

            case "evi": $fp = '../content/videos/'; break;

            case "html":
            case "HTML": $fp = '../content/html/'; break;

            case "EP":
            case "ep":
            case "epaath":
                break;

            case "VOC":       //vocabulary reviews
            case "voc":       //vocabulary reviews
            case "lesson":    //lesson plan
            case "map":       //map
            case "game":    //game
            case "text":      //text
            case "book":      //book
            case "looma":     //looma
            case "chapter":   //chapter
            case "history":   //$fp = '../content/histories/';
            case "blockly-demo":
                break;

		   default:  // unknown filetype

               echo "<button class='activity  img' ";
               echo "data-dn='Unknown' data-ft='none' ";
               echo ">";
               echo '<img alt="" src="' . 'images/alert.jpg' . '">';
               echo "<span>" . "Unknown" . "</span></button>";

               return;
		}  //end SWITCH

        if ($thumb && $thumb != "") $thumbSrc = $thumb;
        else $thumbSrc = thumbnail($fn, $fp, $ft);

    //Now make the BUTTON
      echo "<button class='activity play img' ";

        if ($fp)          echo "data-fp='" .  $fp . "' ";
        if ($lang)        echo "data-lang='" .  $lang . "' ";

        if ($fn)          echo 'data-fn="' .  $fn . '" ';
        if ($nfn)         echo "data-nfn='" .  $nfn . "' ";

        if ($ole_id)      echo "data-ole='" .  $ole_id . "' ";
        if ($grade)       echo "data-grade='" .  $grade . "' ";
        if ($epversion)   echo "data-epversion='" .  $epversion . "' ";

        if ($ft)          echo "data-ft='" .  $ft . "' ";
        if ($ft === 'EP' || $ft === 'ep' || $ft === 'epaath') echo "data-subject='english'";

        if ($dn)          echo "data-dn='" .  $dn . "' ";

        if ($ndn === "") $ndn = null;
        if ($ndn)         echo "data-ndn='" .  $ndn . "' ";

        if ($prefix)      echo "data-prefix='" .  $prefix . "' ";

        if ($mongo_id)    echo "data-id='" .  $mongo_id . "' ";
        if ($mongo_id)    echo "data-mongoid='" .  $mongo_id . "' ";
        if ($ch_id)       echo "data-ch='" .  $ch_id . "' ";
        if ($url)         echo "data-url='" . $url . "' ";

        if ($ft == 'pdf' || $ft == 'chapter') {
            echo "data-page='" . ($pg?$pg:1) . "' ";
            echo "data-len='" . ($url?$url:999) . "' ";
            if ($npg) echo "data-npg='" . $npg . "' ";

            echo "data-zoom='" . $zoom . "' ";}  //assumes zoom='' defaults to zoom-auto

        echo ">";
        if ($thumbSrc) echo '<img alt="" loading="lazy" draggable="false" src="' . $thumbSrc . '">';

    /*    if ( $fp && preg_match('/CDC Teacher Guides/',$fp))
            displayName($fn, 'Teacher\'s Guide', $ndn, 'green');
        else
    */
    displayName($fn, $dn, $ndn, 'black');

    // echo '<img class="icon" src="' . icon($ft) . '">';

        if ($dn) echo "<span class='tip yes-show big-show' >" . $dn . "</span>";
        else if ($ndn) echo "<span class='tip yes-show big-show' >" . $ndn . "</span>";

    //$newButton.append($('<img class="icon" src="' + icons[result.ft] + '">'));
    echo "<img class='icon' src='" . $icons[$ft] . "'>";
    echo "</button>";

	} //end makeActivityButton()

/*********************************/
/******** makeChapterButton *****/
/*********************************/


// NOTE: instead of this long list of args, the fn should take one psaram - an assoc array/object with all the activity's attributes

function makeChapterButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $ole_id, $url, $pg, $len, $zoom, $grade, $epversion, $nfn, $npg, $nlen, $prefix,$lang) {


    if ($thumb && $thumb != "") $thumbSrc = $thumb;
    $thumbSrc = htmlspecialchars($thumbSrc);
    if ( !file_exists($thumbSrc)) $thumbSrc = $fp . "thumbnail.png";

    $fn = htmlspecialchars($fn);

    //Now make the BUTTON
    echo "<button class='activity play img' ";

    if ($fp)          echo "data-fp='" .  $fp . "' ";
    if ($lang)          echo "data-lang='" .  $lang . "' ";

    if ($fn)          echo 'data-fn="' .  $fn . '" ';
    if ($nfn)         echo "data-nfn='" .  $nfn . "' ";

    if ($ole_id)      echo "data-ole='" .  $ole_id . "' ";
    if ($grade)       echo "data-grade='" .  $grade . "' ";
    if ($epversion)   echo "data-epversion='" .  $epversion . "' ";

    if ($ft)          echo "data-ft='" .  $ft . "' ";
    if ($dn)          echo "data-dn='" .  $dn . "' ";

    if ($ndn === "") $ndn = null;

    if ($ndn)         echo "data-ndn='" .  $ndn . "' ";
    if ($prefix)      echo "data-prefix='" .  $prefix . "' ";

    if ($mongo_id)    echo "data-id='" .  $mongo_id . "' ";
    if ($mongo_id)    echo "data-mongoid='" .  $mongo_id . "' ";
    if ($ch_id)       echo "data-ch='" .  $ch_id . "' ";
    if ($url)         echo "data-url='" . $url . "' ";

    echo "data-page='" . ($pg?$pg:1) . "' ";
    if ($npg) echo "data-npg='" . $npg . "' ";

    echo "data-len='" . ($len?$len:1) . "' ";
    if ($nlen) echo "data-nlen='" . $nlen . "' ";

        echo "data-zoom='" . $zoom . "' ";  //assumes zoom='' defaults to zoom-auto

    echo ">";
    echo '<img alt="" draggable="false" src="' . $thumbSrc . '">';
    //echo "<span>" . $dn . "</span>";
    displayName($fn, $dn, $ndn, 'black');
    echo "<span class='tip yes-show big-show' >" . $dn . "</span></button>";

}; //end makeChapterButton()

function downloadButton($path,$file) {

    //echo 'filepath is "' . $path . '" and filename is "' . $file . '"';

    echo "<button class = 'download looma-control-button'>";
      echo "<a href='" . $path . $file . "' download='downloadedfile'>";
      echo "<img src='images/download.png'>";
      tooltip("Download");
      echo "</a></button>";
};  // end downloadButton()

function salt() {
    return substr(bin2hex(uniqid(8)),0,32);
    // NOTE: was using random_bytes() instead of uniqid, but random_bytes is not in php5 used by Looma C2's
};

function encrypt ($clear, $salt) {
    return hash ('sha256',$clear . $salt);
    // NOTE: this code should have used PHP function password_hash() but its too late to change now
};

/*
 * Redirects user to the $page specified or main php file if $page is null
 *
 */
function redirect_user($page)  {

    if (!isset($page) or $page == null) {
        $url = $_SERVER["HTTP_REFERER"];
        if (isset($_SERVER["HTTP_REFERER"])) {
            header("Location: $url");
        }
    } else {
        $url = 'http://'.$_SERVER['HTTP_HOST'].dirname($_SERVER['PHP_SELF']);
        $url .= '/'.$page;
    }

    error_log("exit $url");
    header("Location: $url");
    exit();
}  //end redirect_user

function getFPandFN() { //get and verify FP (filepath) and FN (filename) parameters from POST request
    global $documentroot;
    $fp =  (isset($_POST['fp'])) ? $_POST['fp'] : null;
    $fn =  (isset($_POST['fn'])) ? $_POST['fn'] : null;

    // VERIFY fp.fn is legal filepath
    $pos = strpos(realpath($fp . $fn), $documentroot, 0 );
    if (!$pos or $pos !== 0) {
        echo "Access not allowed";
        exit;
    }
    return array($fp,$fn);

}  // end getFP()
function getFP() { //get and verify FP (filepath) parameter from POST request
    global $documentroot;
    $fp =  (isset($_POST['fp'])) ? $_POST['fp'] : null;

    // VERIFY fp is legal filepath
    $pos = strpos(realpath($fp), $documentroot, 0 );
    if (!$pos or $pos !== 0) {
        echo "Access not allowed";
        exit;
    }
    return $fp;
}  // end getFP()
?>

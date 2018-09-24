<?php

///////////////////
/// functions defined:
/// isHTML
/// isEpaath
/// folderName
/// thumbnail
/// folderThumbnail
/// makeActivityButton
/// //////////////////

/**********************/
/*****  isHTML   ******/
/**********************/
    function isHTML($fp) {
        if ( $fp != '../content/Khan' && file_exists($fp . "/index.html") && !isEpaath($fp))
            return true;
        else return false;
    };  //end function isHTML


/**********************/
/**** isEpaath   ******/
/**********************/
function isEpaath($fp) {
        if (mb_substr($fp, -7, 7) == "epaath/") return true;
        else return false;
    }; //end function isEpaath


/**********************/
/****** folderName*****/
/**********************/
function folderName ($path) {
        // strip trailing '/' then get the last dir name, by finding the remaining last '/' and substring
        $a = explode("/", $path);
        if (count($a) > 1) return $a[count($a) - 2]; else return "";
    };  //end FOLDERNAME()


/**********************/
/***** thumbnail ******/
/**********************/
function thumbnail ($fn) {
            //given a CONTENT filename, generate the corresponding THUMBNAIL filename
            //find the last '.' in the filename, strip off the extension, and append '_thumb.jpg'
            //example: input 'aaa.bbb.mp4' returns 'aaa.bbb_thumb.jpg' - this is the looma standard for naming THUMBNAILS
                $dot = strrpos($fn, ".");  //strrpos finds the LAST occurrence
                if ( $dot ) { return substr($fn, 0, $dot) . "_thumb.jpg";}
                else return "";
      } //end function THUMBNAIL


/**********************/
/**** folderThumbnail   ***/
/**********************/
function folderThumbnail ($fp) {  //for directories, look for filename "thumbnail.png" for a thumbnail representing the contents
    if (file_exists($fp . "/thumbnail.png")) {
        return "<img src='$fp/thumbnail.png' >"; }
    else return "";
}; //end function thumbnail


/*********************************/
/******** makeActivityButton *****/
/*********************************/
function makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom) {
	    // makes an ACTIVITY button (for looma-library, looma-activities, etc)
	    // some parameters are optional for some filetypes
	    //    $ft - filetype, $fp - path to file, $fn - filename, $dn - display name,
	    //    $ch_id - chapter ID, $mongo_id - mongoDB id, $pg - page number, $zoom - initial zoom level

	    //parameters used in buttons for various filetypes
	    //VIDEO            $ft, $fn, $fp, $dn
	    //IMAGE            $ft, $fn, $fp, $dn
	    //AUDIO            $ft, $fn, $fp, $dn
	    //PDF              $ft, $fn, $fp, $dn, $pg, $zoom
	    //SLIDESHOW        $ft, $id (or $fp)       [$thumb?]
	    //EDITED VIDEO     $ft, $fn, $fp, $dn, $id [$thumb?]
	    //ePAATH           $ft, $fn, $fp, $dn
	    //HTML
	    //VOCAB
	    //LESSON PLAN

		if (!$fp) switch ($ft) { //if $fp is not specified, use the default content folder for this $ft

			case "video":
            case "mp4":
            case "mp5":
            case "m4v":
			case "mov": $fp = '../content/videos/'; break;

            case "image":
            case "jpg":
            case "png":
            case "gif": $fp = '../content/pictures/';	break;

			case "audio":
			case "mp3": $fp = '../content/audio/'; break;

			case "pdf":	$fp = '../content/pdfs/'; break;

            case "slideshow": $fp = urlencode('../content/slideshows/'); break;

            case "evi": $fp = '../content/videos/'; break;

            case "html":
            case "HTML": $fp = '../content/html/'; break;

   		    case "EP":
            case "epaath": $fp = '../content/epaath/activities/'; break;

            case "VOC":       //vocabulary reviews
            case "lesson":    //lesson plan
            case "map":       //map
            case "game  ":    //game
            case "text":      //text
            case "looma":     //looma
            case "chapter":   //chapter
            case "history":   //$fp = '../content/histories/';
            case "map":
                break;  //map

		   default:  // unknown filetype

               echo "<button class='activity  img' ";
               echo "data-dn='Unknown' data-ft='none' ";
               echo ">";
               echo '<img src="' . 'images/alert.jpg' . '">';
               echo "<span>" . "Unknown" . "</span></button>";

               return;
		};  //end SWITCH

             if ($thumb && $thumb != "") $thumbSrc = $thumb;
        else if ($ft == 'EP' || $ft == 'epaath') $thumbSrc = $fp . $fn . "/thumbnail.jpg";
        else if ($ft == 'text')  $thumbSrc = "images/textfile.png";
        else if ($ft == 'slideshow')  $thumbSrc = "images/play-slideshow-icon.png";
        else if ($ft == 'looma') $thumbSrc = "images/LoomaLogo.png";
        else                     $thumbSrc = $fp . thumbnail($fn);

        $thumbSrc = htmlspecialchars($thumbSrc);
        if ( !file_exists($thumbSrc)) $thumbSrc = $fp . "thumbnail.png";

        $fn = htmlspecialchars($fn);

        //Now make the BUTTON
                          echo "<button class='activity play img' ";
        if ($fn)          echo 'data-fn="' .  $fn . '" ';
        if ($fp)          echo "data-fp='" .  $fp . "' ";
        if ($ft)          echo "data-ft='" .  $ft . "' ";
        if ($dn)          echo "data-dn='" .  $dn . "' ";
        if ($mongo_id)    echo "data-id='" .  $mongo_id . "' ";
        if ($ch_id)       echo "data-ch='" .  $ch_id . "' ";
        if ($url)         echo "data-url='" . $url . "' ";

        if ($ft == 'pdf' || $ft == 'chapter') {echo "data-pg='" . ($pg?$pg:1) . "' ";     //maybe should set pg=1 if pg not specified??
                          echo "data-zoom='" . $zoom . "' ";}  //assumes zoom='' defaults to zoom-auto

                          echo ">";
                          echo '<img src="' . $thumbSrc . '">';
                          echo "<span>" . $dn . "</span></button>";

	}; //end makeActivityButton()
	?>

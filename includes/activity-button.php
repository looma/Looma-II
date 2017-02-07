<?php

/* //OLD version
	function thumbnail ($fn) {
		//given a CONTENT filename, generate the corresponding THUMBNAIL filename
		//find the last '.' in the filename, insert '_thumb.jpg' after the dot
		//returns "filename_thumb.jpg" if no '.' found
		//example: input 'aaa.bbb.mp4' returns 'aaa.bbb_thumb.jpg' - this is the looma standard for naming THUMBNAILS
		//NOTE: this function could check for existence of the thumbnail and return the image filename if thumb not found

 		$dot = strrpos($fn, ".");
		if ( ! ($dot === false)) { return substr_replace($fn, "_thumb.jpg", $dot, 10);}
		else return $fn . "_thumb.jpg";
	} //end function THUMBNAIL
 */

      function thumbnail ($fn) {  //NEW VERSION AUG '16
            //given a CONTENT filename, generate the corresponding THUMBNAIL filename
            //find the last '.' in the filename, strip off the extension, and append '_thumb.jpg'
            //returns "" if no '.' found
            //example: input 'aaa.bbb.mp4' returns 'aaa.bbb_thumb.jpg' - this is the looma standard for naming THUMBNAILS
                $dot = strrpos($fn, ".");  //strrpos finds the LAST occurance
                if ( $dot ) { return substr($fn, 0, $dot) . "_thumb.jpg";}
                else return "";
      } //end function THUMBNAIL

	function makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $pg, $zoom) {
	    // makes an ACTIVITY button (for looma-library, looa-activities, etc)
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

		if (!$thumb)
		  if ($ft == 'EP' || $ft == 'epaath') $thumb = $fn . "/thumbnail.jpg";
          else { $thumb = ($fn ? thumbnail($fn) : ""); }

		if (!$fp) switch ($ft) { //if $fp is not specified, use the default content folder for this $ft

			case "video":
			case "mp4":
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

            case "html": $fp = '../content/html/'; break;

            case "hist": $fp = '../content/histories/'; break;

   		    case "EP":
            case "epaath": $fp = '../content/epaath/activities/'; break;

            case "VOC": break;  //vocabulary reviews

            case "lesson";  break;  //lesson plan

           case "text";  break;  //lesson plan

		   default:
			     echo "unknown filetype " . $ft;
			     return;
		};  //end SWITCH

        //Now make the BUTTON
                          echo "<button class='activity play img' ";
        if ($fn)          echo "data-fn='" .  $fn . "' ";
        if ($fp)          echo "data-fp='" .  $fp . "' ";
        if ($ft)          echo "data-ft='" .  $ft . "' ";
        if ($dn)          echo "data-dn='" .  $dn . "' ";
        if ($mongo_id)    echo "data-id='" .  $mongo_id . "' ";
        if ($ch_id)       echo "data-ch='" .  $ch_id . "' ";
        if ($ft == 'pdf') {echo "data-pg='" . $pg . "' ";     //maybe should set pg=1 if pg not specified??
                          echo "data-zoom='" . $zoom . "' ";}  //assumes zoom='' defaults to zoom-auto
                          echo ">";
                          echo "<img src='" .
                              ($ft == "looma" ? "" : $fp) .
                              $thumb . "'>";
                          echo "<span>" . $dn . "</span></button>";

	}; //end makeActivityButton()
	?>

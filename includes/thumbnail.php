<?php
      function thumbnail ($fn) {
                //given a CONTENT filename, generate the corresponding THUMBNAIL filename
                //find the last '.' in the filename, strip off the extension, and append '_thumb.jpg'
                //returns "" if no '.' found
                //example: input 'aaa.bbb.mp4' returns 'aaa.bbb_thumb.jpg' - this is the looma standard for naming THUMBNAILS
                $dot = strrpos($fn, ".");  //strrpos finds the LAST occurance
                if ( $dot ) { return substr($fn, 0, $dot-1) . "_thumb.jpg";}
                else return "";
      } //end function THUMBNAIL
?>
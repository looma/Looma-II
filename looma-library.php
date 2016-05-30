<!doctype html>
<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 10
Revision: Looma 2.0.0
File: looma-library.php
Description:  displays and navigates content folders for Looma 2
-->

<?php $page_title = 'Looma Library';
	  	include ('includes/header.php');  
    	include ('includes/mongo-connect.php'); 
?>
		<!-- add CSS files for this page:  <link rel="stylesheet" href="css/filename.css"> -->
	</head>

	<body>	
	<!--  <hr style='width:90%; text-align:center'>  -->
	<div id="main-container-horizontal" class="scroll">

<?php

		function thumbnail ($fn) {
				//given a CONTENT filename, generate the corresponding THUMBNAIL filename
				//find the last '.' in the filename, insert '_thumb' before the dot
				//returns "" if no '.' found
				//example: input 'aaa.bbb.mp4' returns 'aaa.bbb_thumb.jpg' - this is the looma standard for naming THUMBNAILS
		 		$dot = strrpos($fn, ".");
				if ( ! ($dot === false)) { return substr_replace($fn, "_thumb.jpg", $dot, 10);}
				else return "";
			}; //end function THUMBNAIL

		function folderName ($path) {
			// strip trailing '/' then get the last dir name, by finding the remainiong last '/' and substr'ing
			 $a = explode("/", $path);
			 return $a[count($a) - 2];
			};
			
		function makeButton($file, $path, $ext, $base, $dn, $thumb) {
			
				//DEBUG   echo "making button with path= $path  file= $file   ext= $ext"; //DEBUG 
			
				echo "<button class='activity play img' 
							  data-fn='" .  $file . 
						   "' data-fp='" .  $path .
						   "' data-ft='" .  $ext . 
						   "' data-zm='" .  160 .
						   "' data-pg=1" .
						   ">";
					   
				//text and tooltip for BUTTON		   
				echo "<span class='displayname' 
							class='btn btn-default'
							data-toggle='tooltip' 
							data-placement='top' 
							title='" . $file . "'>" . 
						    "<img src='" . $thumb . "'>" . 
							$dn . "</span>";
					   
				//finish BUTTON
				echo "</button>";	
					   
		};  //end makeButton()
	
		function isEpaath($fp) {
		
			//echo "<br>DEBUG: in isEpaath, FP is " . $fp . " Substr is " . mb_substr($fp, -7, 7);
		
			if (mb_substr($fp, -7, 7) == "epaath/") 
				 return true;
			else return false;	
		}; //end function isEpaath

		function thumb_image ($fp) {  //for directories, look for filename "thumb.png" for a thumbnail representing the contents		
			if (file_exists($fp . "/thumbnail.png")) {
				 return "<img src='$fp/thumbnail.png' >"; }
			else return "";
		}; //end fucntion thumbnail
		
	$ep = false;  //set $ep to true for special case of EPaath
	
			// get filepath to use for start of DIR traversal
			//this will be  "../content/" for Looma 2 Library starting folder [to be outside of web-accessible folder structure]
	$path = "../content/";
	if (isset($_GET['fp']))	$path = $_GET['fp'];  
			
			//echo "<br>DEBUG: directory is:  " .  $path . "<br><br>";
	
	if (isEpaath($path)) {$path = $path . "activities/"; $ep = true;}; //in ..resources/epaath/ DIR skip to ..resources/epaath/Activities/
	
	// DEBUG echo "at path " . $path . "folderName is " . folderName($path);
	echo "<h3 class='title'>"; keyword('Looma Library'); echo ":  " . folderName($path) . "</h3>";
	
	//  first list directories in this directory
	echo "<br><br><table id='dir-table'><tr>";
	$buttons = 1;
	$maxButtons = 3;
	
	// iterate through the files in this DIR and make buttons for each included DIR
	if ( ! $ep ) {
		foreach (new DirectoryIterator($path) as $fileInfo) {
   			$file =  $fileInfo->getFilename();
			//if ($file{0}  == ".") continue;  //skips ".", "..", and any ".filename" (more thorough that isDot() )	
    		    		
    		if (($fileInfo -> isDir()) && $file[0] !== "." && ( ! file_exists($path . $file . "/hidden.txt")))  
    			//skips ".", "..", and any ".filename" (more thorough that isDot() )
    			//skips any directory with a file named "hidden.txt"
    		{
    			echo "<td><a href='looma-library.php?fp=" . $path . $file . "/'><button class='activity img zeroScroll'>" .
    			thumb_image($path .$file) . $file . "</button></a></td>";
				$buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};
										
    		};
		}; // end FOREACH directory
	};
	
	echo "</tr></table>";
	
	//now list files in this directory
	
	//DEBUG  echo "in dir " . $path;
	
	echo "<br><table id='file-table'><tr>";
	$buttons = 1;
	$maxButtons = 3;
	
	// iterate through the files in this DIR and make buttons for each included FILE
	
		//TODO: should gather all the filenames into an array and sort it, use (natcasesort() or multisort(), before making the buttons	
			
	foreach (new DirectoryIterator($path) as $fileInfo) {
   		$file =  $fileInfo->getFilename();
		
		//DEBUG  echo "   found " . $file . "<br>";
		
		//skip ".", "..", and any ".filename" and any filename with '_thumb' in the name
		if (($file[0]  == ".") || strpos($file, "_thumb") || $file == "thumbnail.png") continue;  
 
    	if ($fileInfo -> isFile()) {
	
		//this code is also in looma-activities.php - should be a FUNCTION
		echo "<td>";
		$ext = $fileInfo -> getExtension();
		$file = $fileInfo -> getFilename();
		$base = trim($fileInfo -> getBasename($ext), ".");  //$base is filename w/o the file extension
		
		// look in the database to see if this file has a DISPLAYNAME
			$query = array('fn' => $file);
			
			$projection = array('_id' => 0, 
							    'dn' => 1, 
								);		
			$activity = $activities_collection -> findOne($query, $projection);

  			$dn = ($activity && array_key_exists('dn', $activity)) ? $activity['dn'] : $base;	
		//
		//DEBUG   echo "activity is " . $activity['dn'] . " looked up '" . $file . "' and got '" . $dn . "'";
		
			switch (strtolower($ext)) {
				case "video":
				case "mp4":
				case "mov":
		
				case "image":
				case "jpg":
				case "png":
				case "gif":
	
				case "audio":
				case "mp3":
		
				case "pdf":

					makeButton($file, $path, $ext, $base, $dn, $path . $base . "_thumb.jpg");
					break;

				default:
					// ignore unknown filetypes
					// echo "DEBUG: " . $fileInfo -> getFilename() . "unkown filetype in looma-library.php";
			};  //end SWITCH			
			echo "</td>";
			$buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};
			
			}
			else {  //handle Epaath special case
				if ($ep) {
					// display an EPAATH play button
					echo "<td>";
					makeButton($file, $path, 'epaath', $file, 'ePaath ' . $file, $path . $file . "/thumbnail.jpg");
					echo "</td>";
					$buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};
								
				}
			} 
		} //end FOREACH file
		echo "</tr></table>";		
?>

	</div>
	
   	<?php include ('includes/toolbar.php'); ?>   	   		
   	<?php include ('includes/js-includes.php'); ?> 
   	<script src="js/looma-library.js"></script>  <!-- borrowed from looma-activities.js -->

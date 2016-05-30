<?php

	/*Prototype for ACTIVITY: array ("displayname" > "",
						"filename" => "xxxx.mp4", 
						"filepath" => "",
						"filetype" => "mp4"); 
	*/
	
	/*Prototype for CHAPTER: array("textbook1" => "xxx.pdf",
					  "pagenum1" => 1, 
					  "textbook2" => "yyy.pdf",
					  "pagenum2" => 10,
					  "activities" => array($activity1, $activity2, ...));
	*/
	
	/*Prototype for CHAPTERS: array($chapter, $chapter, ...)
	 * 
	 *Prototype for TEXTBOOK: array( "class" => "class1",
					"subject" => "math",
					"displayname" => "xxxx",
					"filenane" => "Math-1.pdf",
					"filepath" => "resources/textbooks/Class1/",
					"nativedisplayname" => "xxxx",
					"nativefilenane" => "Math-1-Nepali.pdf",
					"nativefilepath" => "resources/textbooks/Class1/"
					); 
	 */
 
	include ('includes/mongo-connect.php'); 
	$act_ids = array();
	$ch_ids = array();
	
	$id = new MongoId(); 	 
	$activity1 = array ("_id" => $id,
						"displayname" => "Test Video",
						"filename" => "Six_Blind_Men.mp4", 
						"filepath" => "resources/videos/",
						"filetype" => "mp4");
	$act_ids[] = $id;
	
	$id = new MongoId();				
	$activity2 = array ("_id" => $id,
						"displayname" => "Test Image",
						"filename" => "Bug.png", 
						"filepath" => "resources/pictures/",
						"filetype" => "png");						
	
	$act_ids[] = $id;
	
	$id = new MongoId();				
	$activity3 = array ("_id" => $id,
						"displayname" => "Test PDF",
						"filename" => "Circle.pdf", 
						"filepath" => "resources/pdfs/",
						"filetype" => "pdf");
	$act_ids[] = $id;
	
	$id = new MongoId();											
	$activity4 = array ("_id" => $id,
						"displayname" => "Test PDF",
						"filename" => "testPDF.pdf", 
						"filepath" => "resources/pdfs/",
						"filetype" => "pdf");
	$act_ids[] = $id;
	
	$id = new MongoId();										
	$activity5 = array ("_id" => $id,
						"displayname" => "Test audio",
						"filename" => "song.mp3", 
						"filepath" => "resources/audio/",
						"filetype" => "audio");
	$act_ids[] = $id;
	
	$id = new MongoId();					
	$chapter1 = array("_id" => $id,
					"textbook1" => "Math-2.pdf",
					  "pagenum1" => 1, 
					  "textbook2" => "Math-2-Nepali.pdf",
					  "pagenum2" => 10,
					  "activities" => $act_ids);
	$ch_ids[] = $id;
	
	$id = new MongoId();
	$chapter2 = array("_id" => $id,
					  "textbook1" => "Math-2.pdf",
					  "pagenum1" => 5, 
					  "textbook2" => "",
					  "pagenum2" => 15,
					  "activities" => $act_ids);
	$ch_ids[] = $id;
					  
	$activities_collection->save($activity1);
	$activities_collection->save($activity2);
	$activities_collection->save($activity3);
	$activities_collection->save($activity4);
	$activities_collection->save($activity5);
	
	$chapters_collection->save($chapter1);
	$chapters_collection->save($chapter2);
	
	$id = new MongoId();			
	$tb1 = array( "_id" => $id,
				    "class" => "class1",
					"subject" => "math",
					"displayname" => "Math Textbook",
					"filenane" => "Math-1.pdf",
					"filepath" => "resources/textbooks/Class1/",
					"nativedisplayname" => "Math Textbook in Nepali",
					"nativefilenane" => "Math-1-Nepali.pdf",
					"nativefilepath" => "resources/textbooks/Class1/",
					"chapters" => $ch_ids
					); 	

	$id = new MongoId();											
	$tb2 = array( "_id" => $id,
					"class" => "class1",
					"subject" => "science",
					"displayname" => "Science Textbook",
					"filenane" => "Science-1.pdf",
					"filepath" => "resources/textbooks/Class1/",
					"nativedisplayname" => "Science Textbook in Nepali",
					"nativefilenane" => "Science-1-Nepali.pdf",
					"nativefilepath" => "resources/textbooks/Class1/",
					"chapters" => $ch_ids
					); 
	
	$textbooks_collection->save($tb1);
	$textbooks_collection->save($tb2);

?>
<!--

Author: Alexa Thomases, Catie Cassani, May Li

Filename: looma-history.php

Date: July 2017

Description: Creates a timeline with search and hover functions. Information accessed through database.

-->



  <?php $page_title = 'Looma - History Timeline';

    include ("includes/header.php");

    include ("includes/mongo-connect.php");

  ?>

    <link href='css/looma-history.css' rel='stylesheet' type='text/css'>





    <title>Looma History Timeline</title>

</head>



<body>

    <div id="main-container-horizontal">

      <label for="keywords">Search:</label><input id="keywords" class="searchBar" size="18" placeholder="enter words to search" onkeypress="handleKeyPress(event)">



      <button class="scrollButtonLeft">   <img src="images/back-arrow.png">        </button>

      <button class="scrollButtonRight"> <img src="images/forward-arrow.png">      </button>

      <button class="returnToLeftmost">      <img src="images/reverse-double-arrow.png"> </button><br>



      <?php



        //Load Timeline

        if (isset($_REQUEST["title"]) || (isset($_REQUEST["chapterToLoad"]))) {

        if (isset($_REQUEST["title"])) $hist = $_REQUEST["title"];

        if (isset($_REQUEST["chapterToLoad"])) $ch_id = $_REQUEST["chapterToLoad"];

        //Search Database and Get Cursor

        if (isset($hist)) $query = array("title" => $hist);

        else       $query = array("ch_id" => $ch_id);

              

        $cursor =  $history_collection->find($query, array("title"=>1, "events"=>1)); //should be findOne()  ??



        foreach ($cursor as $doc) {



          $title = array_key_exists('title', $doc) ? $doc['title'] : null;

          echo "<h1> History: $title </h1>";



echo '<div id="playground">';

    echo '<section class ="timeline">';

       echo '<ol>';



  $count = 0; 



          foreach($doc['events'] as $event) {

                /*working on getting id recognition working*/

                //foreach($event['popup'] as $popinfo) {





                $msg = "";

                $id1 = "";

                $id2 = "";



                 if(isset($event['popup'][0]))

                  $msg = 'data-msg=' . $event['popup'][0] ;

                if(isset($event['popup'][1]))

                  $id1 = 'data-id1=' . $event['popup'][1];

                if(isset($event['popup'][2]))

                  $id2 = 'data-id2='. $event['popup'][2];

  

  /*

                if(isset($popinfo['msg']))

                  $msg = 'data-msg=' . $popinfo['msg'] ;

                if(isset($popinfo['id1']))

                  $id1 = 'data-id1=' . $popinfo['id1'];

                if(isset($popinfo['id2']))

                  $id2 = 'data-id2='. $popinfo['id2'];

                  



                 /*doesn't check if they exist like it should :(*/



                /*

      

                if($event.popup.id2)

                  $id2 = 'data-id2= "$event.popup.id2 "';



                if($event.popup.id3)

                  $id3 = 'data-id3= "$event.popup.id3 "';



                /*and a bit below (the id part)*/

                //}

                if ($count%2 == 0)

                {

            

                 echo '

                 <li>

                   <div class="timeline-description">

                     <div class="dropdown" style="float:">'; // edited out

                 echo '<button class="dropbtn"' . " " . $id1 . " " . $id2 . " " . $msg . '>' . $event['title'] . '</button>';

                 echo '<button class="dropdate">' . $event['date'] . '</button>';

                     '</div>

                 </li>';

               }

               else

               {

                    echo '

                 <li>

                   <div class="timeline-description">

                     <div class="dropdown" style="float:">'; // edited out

                     echo '<button class="dropdate">' . $event['date'] . '</button>';

                 echo '<button class="dropbtn"' . " " . $id1 . " " . $id2 . " " . $msg . '>' . $event['title'] . '</button>';

                 

                     '</div>

                 </li>';

               }



                 $count += 1;



          }  //end foreach doc[elements] as event

          echo '</ol>';

        } //end foreach cursor as doc

        } //end if isset()

        else

        {echo 'no history found';}

      ?>



 

</div>

</div>



    <?php include ('includes/toolbar.php'); ?>

    <?php include ('includes/js-includes.php'); ?>



    <script type="text/javascript" src="js/hilitor-utf8.js"></script>

    <script type="text/javascript" src="js/looma-history.js"></script>

    <button class="speak"></button>

    <button class = "lookup"></button>



</body>

</html>
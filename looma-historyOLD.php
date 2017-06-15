<!--
Author: Ellie Kunwar, Jayden Kunwar
Filename: looma-history.php
Date: July 2016
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
    <div id="main-container-vertical">
      <label for="keywords">Search:</label><input id="keywords" class="searchBar" size="18" placeholder="enter words to search">

      <button class="scrollButtonUp">   <img src="images/looma-up.png">        </button>
      <button class="scrollButtonDown"> <img src="images/looma-down.png">      </button>
      <button class="returnToTop">      <img src="images/double-up-arrow.png"> </button><br>

      <?php

        //Load Timeline
        if (isset($_REQUEST["chapterToLoad"]))
        {$ch_id = $_REQUEST["chapterToLoad"];
        //Search Database and Get Cursor
        $query = array("ch_id" => $ch_id);
        $cursor =  $history_collection->find($query, array("title"=>1, "events"=>1)); //should be findOne()  ??

        foreach ($cursor as $doc) {

          $title = array_key_exists('title', $doc) ? $doc['title'] : null;
          echo "<h1> History: $title </h1>";

echo '<div id="playground">';

          echo '<ul class="timeline-both-side">';
          $shouldGoLeft = true;

          foreach($doc['events'] as $event) {
               if ($shouldGoLeft) {  /* left side items */
                 echo '
                 <li>
                 <div class="border-line"></div>
                   <div class="timeline-description">
                     <div class="dropdown" style="float:left">';
                 echo '<button class="dropbtn">' . $event['title'] . '</button>';
                 echo '<div class="dropdown-content" style="left:0;">';
                   echo $event['hover'];
                 echo '</div>
                     </div>
                   </div>
                 </li>';
               } else  /* right side items */
               {
                 echo '
                 <li class="opposite-side">
                 <div class="border-line"></div>
                   <div class="timeline-description">
                     <div class="dropdown" style="float:left">';
                 echo '<button class="dropbtn">' . $event['title'] . '</button>';
                 echo '<div class="dropdown-content" style="left:0;">';
                   echo $event['hover'];
                 echo '</div>
                     </div>
                   </div>
                 </li>';
               }

               $shouldGoLeft = !$shouldGoLeft;
          }  //end foreach doc[elements] as event
          echo '</ul>';
        } //end foreach cursor as doc
        } //end if isset()
        else
        {echo 'no history found';}
      ?>


</div>
</div>

    <?php include ('includes/toolbar-vertical.php'); ?>
    <?php include ('includes/js-includes.php'); ?>

    <script type="text/javascript" src="js/hilitor-utf8.js"></script>
    <script type="text/javascript" src="js/looma-history.js"></script>

</body>
</html>
<!--
Author: Ellie Kunwar, Jayden Kunwar
Email:
Filename: looma-history.php
Date: July 2016
Description: Creates a timeline with search and hover functions. Information accessed through database.
-->

<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
    
    <?php $page_title = 'Looma - History Timeline';
	  include ("includes/header.php");
	  include ("includes/mongo-connect.php");
    ?>
  
  <title>Responsive Timeline</title>
  <script type="text/javascript" src="js/looma-history.js"></script>
  <link href='http://fonts.googleapis.com/css?family=Open+Sans:400,300,600,700' rel='stylesheet' type='text/css'>
  <link href='css/looma-history.css' rel='stylesheet' type='text/css'>
</head>

<body>
  <form>
      <p>Search: <input id="keywords" class="searchBar" size="18" placeholder="type keywords"></p>
  </form>
  <button class="scrollButtonUp" onclick="scrollUp()">UP</button><br><br>
  <button class="scrollButtonDown" onclick="scrollDown()">DOWN</button><br><br>
  <!-- Return to Top -->
  <a href="javascript:" id="return-to-top">^<i class="icon-chevron-up"></i></a>     
  <div class="container">
    <div id="playground" style="margin:1em 0; padding:0 1em; border: 1px solid #ccc;">
      <?php
        //create the toolbar
        include ('includes/toolbar-vertical.php'); 
   	    include ('includes/js-includes.php');
        //Connents to Mongo DB
        $m = new MongoClient();
        $fileDB = $m->looma;
        $activities = $fileDB -> timelines;
        
        //Get Timeline To Load
        $ch_id = $_REQUEST["chapterToLoad"];

        //Search Database and Get Cursor
        $query = array("ch_id" => $ch_id);
        $cursor = $activities->find($query, array("timelineTitle"=>1, "content"=>1));

        foreach ($cursor as $doc) {
          $title = array_key_exists('timelineTitle', $doc) ? $doc['timelineTitle'] : null;
          echo "<h1 align = center> $title </h1>";

          echo '<ul class="timeline-both-side">';
          $shouldGoLeft = true;

          foreach($doc['content'] as $event) {
               if ($shouldGoLeft) {
                 echo '
                 <li>
                 <div class="border-line"></div>
                   <div class="timeline-description">
                     <div class="dropdown" style="float:left">';
                 echo '<button class="dropbtn">' . $event['title'] . '</button>';
                 echo '<div class="dropdown-content" style="left:0;">';
                   echo $event['hoverContent'];
                 echo '</div>
                     </div>
                   </div>
                 </li>';
               } else {
                 echo '
                 <li class="opposite-side">
                 <div class="border-line"></div>
                   <div class="timeline-description">
                     <div class="dropdown" style="float:left">';
                 echo '<button class="dropbtn">' . $event['title'] . '</button>';
                 echo '<div class="dropdown-content" style="left:0;">';
                   echo $event['hoverContent'];
                 echo '</div>
                     </div>
                   </div>
                 </li>';
               }

               $shouldGoLeft = !$shouldGoLeft;
          }
          echo '</ul>';
        }
      ?>
      
<script type="text/javascript" src="js/looma-history.js"></script>
<script type="text/javascript" src="js/hilitor-utf8.js"></script>
<script type="text/javascript">


</div>
</div>

</body>
</html>
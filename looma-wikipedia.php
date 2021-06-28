<!doctype html>
<!--
Filename: looma-wikipedia.php
Description: buttons to access wikipedia title index and subject index

Author: Skip
Owner:  Looma Education Company
Date:   2021
-->

<?php $page_title = 'Looma Wikipedia';
require_once ('includes/header.php');
?>

</head>

<body>
<div id="main-container-horizontal">
    <div id="fullscreen">
        <br><h3 class='title'> <?php keyword('Wikipedia') ?> </h3>

    <table id="dir-table">
     <tr>
         <td>
          <a href="looma-html.php?fp=../content/W4S2013/wp/index/&fn=alpha.htm">
                <button id="wikipedia-titles" class="activity img play">
                    <img src="images/logos/wikipedia.jpg"/>
                    <?php keyword("Search by Title");?>
                </button>
            </a>
         </td>
         <td>
            <a href="looma-html.php?fp=../content/W4S2013/wp/index/&fn=subject.htm">
                <button id="wikipedia-subjects" class="activity img play">
                    <img src="images/logos/wikipedia.jpg"/>
                    <?php keyword("Search by Subject");?>
                </button>
            </a>
         </td>
         <td>
            <a href="looma-html.php?fp=../content/W4S2013/wp/index/&fn=subject.Portals.htm">
                <button id="wikipedia-subjects" class="activity img play">
                    <img src="images/logos/wikipedia.jpg"/>
                    <?php keyword("Portals");?>
                </button>
            </a>
        </td>
     </tr><tr>
        <td><button class=" img " hidden></button></td>
        <td>
           <a href="looma-html.php?fp=../content/W4S2013/&fn=index.htm">
                <button class="activity play img" data-fp="../content/W4S2013/" data-fn="index.htm" data-ft="html"
                data-dn="Wikipedia" data-ndn="विकिपीडिया">
                    <img loading="lazy" draggable="false" src="images/logos/wikipedia.jpg">
                    <?php keyword("About Wikipedia for Schools");?>
                </button>
            </a>
        </td>
    </tr>
    </table>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>      <!-- js-includes.php imports JS: looma.js, looma-utilities.js, looma-screenfull.js,
                                                            looma-keyboard.js, jQuery -->

</body>
</html>

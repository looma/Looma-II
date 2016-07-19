<?php
  $query = $_REQUEST['q'];
  $basePath = "content/" . $query;
  echo $basePath;
  $showThumbnails = ($_REQUEST['showThumbnails']) == 'true';
  $currNum = 0;
  $currPos = 1;
  echo '<div id="fileStructure" class="container">';
    echo '<table class="table table-striped fileStructureTD">';
      echo "<tbody>";
      if ($basePath != "content/")
        echo "<tr> <td>  <button class='directoryButton' shouldGoToParent='true' linksTo='$query$file'> Back </button> </td>";
      else {
        $currPos = 0;
      }
        foreach (new DirectoryIterator($basePath) as $fileInfo) {
          $mod = ($currPos % 2);

          $file =  $fileInfo->getFilename();
          if (($fileInfo -> isDir()) && ($file[0] !== ".") && (!file_exists($basePath . $file . "/hidden.txt"))) {
            if (($currPos % 2) == 0) {
              echo "<tr>";
            }
            echo "<td>  <button class='directoryButton' linksTo='$query$file/'> $file/ </button> </td>";
            //Is a file and file name doesn't start with a . ex .DS_store
            if (($currPos % 2) == 1) {
              echo "</tr>";
            }
            $currPos += 1;
          } else if ($fileInfo -> isFile() && (strpos($file, ".") != 0) && (strpos($file, '_thumb') == false)) {
            if (($currPos % 2) == 0) {
              echo "<tr>";
            }
            $thumbnailLoc = $basePath . substr($file, 0, strpos($file, ".")) . "_thumb.jpg";
            if (file_exists($thumbnailLoc) && $showThumbnails) {
              echo "<td class='thumbnailTable'> <img class='thumbnail' src='$thumbnailLoc'> </td>";
            }
            echo "<td class='fileResult'> <button class='fileButton' linksTo='$query$file'> $file </button> </td>";
            if (($currPos % 2) == 1) {
              echo "</tr>";
            }
            $currPos += 1;
          }
        }; // end FOREACH directory
      echo "</tbody>";
    echo '</table>';
  echo "</div>";
?>

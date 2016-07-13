<?php
  $query = $_REQUEST['q'];
  $basePath = "content/" . $_REQUEST['q'];
  echo $basePath;
  $currNum = 0;
  echo '<div id="fileStructure" class="container">';
    echo '<table class="table table-striped">';
      echo "<tbody>";
      if ($basePath != "content/")
        echo "<tr> <td>  <button class='directoryButton' shouldGoToParent='true' linksTo='$query$file'> Back </button> </td> </tr>";
        foreach (new DirectoryIterator($basePath) as $fileInfo) {
          $file =  $fileInfo->getFilename();
          if (($fileInfo -> isDir()) && ($file[0] !== ".") && (!file_exists($basePath . $file . "/hidden.txt"))) {
            echo "<tr> <td>  <button class='directoryButton' linksTo='$query$file/'> $file/ </button> </td> </tr>";
            //Is a file and file name doesn't start with a . ex .DS_store
          } else if ($fileInfo -> isFile() && (strpos($file, ".") != 0)) {
            echo "<tr> <td> <button class='fileButton' linksTo='$query$file'> $file </button> </td> </tr>";
          }
        }; // end FOREACH directory
      echo "</tbody>";
    echo '</table>';
  echo "</div>";
?>

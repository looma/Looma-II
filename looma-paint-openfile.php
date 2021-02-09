<!doctype html>
<html>
<!-- skip comment -->
<head>
  <title>Open a Drawing</title>
  <meta charset="utf-8"/>
  <link rel="stylesheet" href="css/looma.css"/>
  <link rel="stylesheet" href="css/looma-paint-openfile.css"/>
</head>
<body>
  <?php include ('includes/looma-translate.php'); ?>
  <h1><?php keyword('Click a saved drawing to open it'); ?></h1>
  <button id="back"><img src="images/back-arrow.png"></button>
  <div id="backmessage"><?php keyword('Back to the Paint page'); ?></div>

  <div id="previews">

  </div>
  <?php include ('includes/js-includes.php'); ?>
  <script src="js/looma-paint-openfile.js"></script>
</body>
</html>

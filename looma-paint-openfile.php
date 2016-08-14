<!doctype html>
<html>
<head>
  <title>Open a Drawing</title>
  <meta charset="utf-8"/>
  <link rel="stylesheet" href="css/looma.css"/>
  <link rel="stylesheet" href="css/looma-paint-openfile.css"/>
</head>
<body>
  <?php include ('includes/translate.php'); ?>
  <h2><?php keyword('Pick a saved drawing'); ?></h2>
  <button id="back"><img src="images/back-arrow.png"><?php keyword('Back to the Paint page'); ?></button>

  <div id="previews">

  </div>
  <?php include ('includes/js-includes.php'); ?>
  <script src="js/looma-paint-openfile.js"></script>
</body>
</html>

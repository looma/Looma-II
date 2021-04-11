

<?php
	if(isset($_POST['submit'])){
	$filename = $_FILES["myfile"]["name"];
	$dn= $_REQUEST["displayname"];
	$author=$_REQUEST["author"];
	$filetype = $_FILES["myfile"]["type"];
	$filesize = $_FILES["myfile"]["size"];
	$tempfile = $_FILES["myfile"]["tmp_name"];
	$filenameWithDirectory = "../content/recorded_videos/".$dn.".mp4";
	} else {
		echo "something went wrong";
	}
?>

<?php $page_title = 'Looma Home Page';
require_once ('includes/header.php');
?>

<link rel="stylesheet" href="css/looma-home.css">

</head>

<body>

<script type="text/javascript">
var dn = "<?php echo $dn ?>";
var ft = 'video';
var collection = 'recordedVideos';
var data = "<?php echo $author ?>";
var activity= 'true'
</script>

<div id="main-container-horizontal">
	<a href="#!" class="btn btn-success" onClick="savefile(dn,collection,ft,data,activity)">Save to Looma</a>

	<?php
	if(move_uploaded_file($tempfile, $filenameWithDirectory))
	{
		echo "<h2>File Uploaded</h2>";
		echo "<p>You file is uploaded successfully.</p>";
		echo "<p>File name = <b>$filename</b></p>";
		echo "<p>File type = <b>$filetype</b></p>";
		echo "<p>File size = <b>$filesize</b></p>";
	}
	else 
	{
		echo "Error occurred during file upload!";
	}
?>

</div>
<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>

<script src="js/looma-video-upload.js"></script>
<script src="js/jquery.hotkeys.js">           </script>
        <script src="js/tether.min.js">  </script>
        <script src="js/bootstrap.min.js">           </script>
        <script src="js/bootstrap-wysiwyg.min.js">   </script>
</body>

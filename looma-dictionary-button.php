<html>

<?php $page_title = 'Looma Dictionary Lookup Test Page';
      include ('includes/header.php');
      include ('includes/mongo-connect.php');
      ?>
	<link rel="stylesheet" href="css/bootstrap.min.css">
	<link rel="stylesheet" href="css/looma.css">
</head>
<body>
	<!-- Trigger the modal with a button -->
	<button type="button" class="lookup" onclick="getDictionaryLookup()" data-toggle="modal"  data-target="#dictionaryPopup">Look Up Word</button>

    <br><br><br>
    <h2>Looma dictionary lookup test page</h2>
    <br><br><br>
	Hello These Are A Bunch Of Words To Test With boy girl elephant tiger

	<!-- Modal -->
	<div id="dictionaryPopup" class="modal fade" role="dialog">
		<div class="modal-dialog">

			<!-- Modal content-->
			<div class="modal-content">
				<div class="modal-header">
					<button type="button" class="close" data-dismiss="modal">&times;</button>
					<h4 class="modal-title">Dictionary Result</h4>
				</div>
				<div class="modal-body">
					<div id="dictionaryResult"> </div>
					<div id="word"> English: </div>
					<div id="nepali"> Nepali: </div>
					<div id="definition"> Definition: </div>
					<div id="partOfSpeech"> Part Of Speech: </div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
				</div>
			</div>
		</div>
	</div>

</body>
    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>
    <script src="js/jquery.js"></script>
    <script src="js/bootstrap.min.js"></script>
    <script src="js/looma-dictionary-button.js"></script>

</html>

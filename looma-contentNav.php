<html>
<head>
	<!-- JQuery -->
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.2/jquery.min.js"></script>

	<meta name="viewport" content="width=device-width, initial-scale=1">

	<!-- Latest compiled and minified CSS -->
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7" crossorigin="anonymous">

	<!-- Optional theme -->
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap-theme.min.css" integrity="sha384-fLW2N01lMqjakBkx3l/M9EahuwpSfeNvV63J5ezn3uZzapT0u7EYsXMjQV+0En5r" crossorigin="anonymous">

	<!-- Latest compiled and minified JavaScript -->
	<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js" integrity="sha384-0mSbJDEHialfmuBBQP6A4Qrprq5OVfW37PRR3j5ELqxss1yVqOtnepnHVP9aJ7xS" crossorigin="anonymous"></script>

</head>
<body style="margin-top: 30px;">
	<div class="container" >
		<div class="col-md-2"></div>
		<div class="col-md-8">
			<div class="row">
				<div class="col-md-3">
					<!-- Trigger the modal with a button -->
					<button type="button" class="btn btn-info btn-md" data-toggle="modal" data-target="#myModal">Location To Add To</button>

					<!-- Modal -->
					<div id="myModal" class="modal fade" role="dialog">
						<div class="modal-dialog">

							<!-- Modal content-->
							<div class="modal-content">
								<div class="modal-header">
									<button type="button" class="close" data-dismiss="modal">&times;</button>
									<h4 class="modal-title">Location To Add To</h4>
								</div>
								<div class="modal-body">
										<div id="classSelect"> <?php include 'looma-contentNav-chapterSelect.php' ?> </div>
										<div id="lessonSelect"> </div>

								</div>
								<div class="modal-footer">
									<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="col-md-9">
					<form role="form">
						<div class="form-group">
							<input type="text" class="form-control" size="30" onkeyup="search(this.value)">
						</div>
					</form>
				</div>
			</div>
			<div id="resultsArea"></div>
		</div>
	</div>

	<div class="col-md-2"></div>


	<! Init Script Last To Improve Load Time->
	<script src="js/looma-contentNav.js"></script>
</body>
</html>

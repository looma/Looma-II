<!--
Name: Ian
Email: ian.costello@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 6
Revision: Looma 2.0.0
File: looma-contentNav.php
Description:  Provides a system for adding activities to the looma system
-->
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

	<!-- Custom Theme -->
	<link rel="stylesheet" href="css/looma-contentNav.css">
</head>
<body style="margin-top: 30px;">
	<div class="container" >
		<div class="col-md-2"></div>
		<div class="col-md-8">
			<div class="row">
				<div class="col-md-3">
					<!-- Trigger the modal with a button -->
					<button type="button" class="btn btn-info btn-md" data-toggle="modal" data-target="#contentNavModal">Location To Add To</button>

					<!-- Modal -->
					<div id="contentNavModal" class="modal fade" role="dialog">
						<div class="modal-dialog">
							<!-- Modal content-->
							<div class="modal-content" id="contentNavModal">
								<!-- Modal Header -->
								<div class="modal-header">
									<button type="button" class="close" data-dismiss="modal">&times;</button>
									<h4 class="modal-title">Select File Insert Location</h4>
								</div>
								<!-- Class Nav Loaded In Here -->
								<div class="modal-body">
										<div id="classSelect"> <?php include 'looma-contentNav-classNav.php' ?> </div>
										<div id="lessonSelect"> </div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Search Bar -->
				<div class="col-md-9">
					<form role="form">
						<div class="form-group">
							<input type="text" id="searchArea" class="form-control" size="30" onkeyup="search(this.value, false, 0)">
						</div>
					</form>
				</div>
			</div>

			<!-- Results are Loaded in Here-->
			<div id="resultsArea"></div>
			<!-- Loads More Results On Hover -->
			<div id="loadMore" class="well well-sm individualResult">
				<h3 style="text-align: center;"> Hover To Load More Content </h3>
			</div>
		</div>
	</div>

	<div class="col-md-2"></div>


	<!-- Init Script Last To Improve Load Time-->
	<script src="js/looma-contentNav.js"></script>
</body>
</html>

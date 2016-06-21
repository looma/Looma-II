<!--
Name: Ian
Email: ian.costello@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 6
Revision: Looma 2.0.0
File: looma-contentNav-result.php
Description: Single row of search results
-->
<div class="row">
	<style>
	footer.well {
    	margin-top: 0px;
    	border-bottom: none;
	}
	.result {
		background-color: grey;
		padding-left: 30px;
	}
	.fullResult {
		display: none;
		border: 1px solid transparent;
	}

	</style>

	<div class="well well-sm individualResult">
		<h4><?php echo $title ?></h4>
		<div class="limitedResult">This is the limited result <?php echo $text ?></div>
		<a href="#" class="btn btn-info btn-lg">
          <span class="glyphicon glyphicon-plus"></span> Add
    </a>
		<div class="fullResult">
			This is a bunch of text
		</div>
	</div>
</div>

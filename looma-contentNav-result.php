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

	.well {
		margin: 10px;
	}

	</style>

	<div class="well well-sm individualResult" dbid=<?php echo $d_id; ?>>
		<h4><?php echo $title ?></h4>
		<div class="limitedResult">This is the limited result <?php echo $text ?></div>
	</div>
</div>

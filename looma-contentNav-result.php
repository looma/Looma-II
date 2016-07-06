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

	<div class="well well-sm individualResult" dbid=<?php echo $d_id; ?> title=<?php echo '"' . $d_title . '"'; ?> chid=<?php echo '"' . $chid . '"'; ?>>
		<h4><?php echo $d_title;?></h4>
		<div class="limitedResult"><b>Source</b> - Khan Academy </div>
	</div>
</div>

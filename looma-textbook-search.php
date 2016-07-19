<!--
Name: Ian
Email: ian.costello@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 6
Revision: Looma 2.0.0
File: looma-textboox-search.php
Description: Searchs Mongo Database for a chapter
-->
<?php
include 'includes/mongo-connect.php';

//Get Query and Page To Load
$request = $_GET["q"];

//Build Regex .* is anything and i is ignore case
$regex = new MongoRegex('/^.*' . $request . '/i');

//Query For Item
$query = array("dn" => $regex);
$cursor = $chapters_collection->find($query)->limit(10);

foreach ($cursor as $d)
{
	//Grab The ID, Title, and description
	$chid = array_key_exists('_id', $d) ? $d['_id'] : null;
	$d_title = array_key_exists('dn', $d) ? $d['dn'] : null;

	//Add the search result
	echo "
	<tr>
		<td class='chapterResult' ch_id='$chid' >
			<h4 class='center'> $d_title - $chid </h4>
		</td>
	</tr>
	";
}

?>

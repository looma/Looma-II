<html>
	<body><h1>this is mongotest.php</h1>
		<?php 
			//echo "in mongotest";
			
		if (file_exists("vendor/autoload.php"))	include 'vendor/autoload.php';
			//echo "past require";			
try {
	$client = new MongoDB\Client;
	 echo "found MongoDB Client"; 
	}
catch (Exception $e) {echo "no MongoDB Client found";}


			echo nl2br("__DIR__ is " . __DIR__ . "\r\n");

			$client = new MongoDB\Client;
			//echo "past client = new";
			//echo $client;
			$dictionary = $client->looma->dictionary;
			
			$result = $dictionary -> findOne(['en' => 'and']);
			echo nl2br("the word <b>" . $result['en'] . "</b> translates to  <b>" . $result['np'] . "</b>\r\n");
			$result = $dictionary -> findOne(['en' => 'boy']);
			echo nl2br("the word <b> " . $result['en'] . "</b>  translates to  <b>" . $result['np'] . "</b>\r\n");
			$result = $dictionary -> findOne(['en' => 'girl']);
			echo nl2br("the word <b> " . $result['en'] . "</b>  translates to  <b>" . $result['np'] . "</b>");
			echo " - - -  its definition is " . $result['def'];
		?>
	</body>
</html>

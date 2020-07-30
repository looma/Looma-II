<html>
	<body><h1>this is mongotest.php</h1>
		<?php

        function printout($x) { echo nl2br("<b>" . $x . "</b>\r\n");}

        //echo "in mongotest";
        exec("eval '/usr/bin/which mongo'",$which,$returncode);
        printout("return code is " . $returncode . ", which mongo is " . which[0]);
        //exec('echo $PATH',$mongo_version,$returncode);
        //printout("return code is " . $returncode . ' output is '. $mongo_version);print_r ($mongo_version);

        exec('/Applications/AMPPS/mongodb/bin/mongo --version',$mongo_version,$returncode);
        //exec("$which[0] --version",$mongo_version,$returncode);
        printout("return code is " . $returncode);
        print_r($mongo_version);printout("");

        if ($mongo_version) {
            preg_match('/\d\.\d\.\d/', $mongo_version[0], $matches);
            $mongo_version = $matches[0];
            $mongo_level = intval($mongo_version[0]);
        } else {
            $mongo_version = '8.0.0';
            $mongo_level = 8;
        }
        printout("mongo_level is " . $mongo_level);


			echo nl2br("__DIR__ is " . __DIR__ . "\r\n");

			if ($mongo_level === 2) $client = new MongoClient;
			else                    $client = new MongoDB\Client;
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

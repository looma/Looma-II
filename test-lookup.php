<?php
/**
 * Test script for exercising a real lookup
 */

echo "=== Dictionary Lookup Test ===\n";
error_reporting(E_ALL);
ini_set('display_errors', 1);

chdir(__DIR__);

// Simulate an AJAX request
$_REQUEST['cmd'] = 'lookup';
$_REQUEST['word'] = 'hello';

echo "Testing lookup for the word: 'hello'\n";
echo "Directory: " . getcwd() . "\n\n";

// Include the utilities file
try {
    require_once('includes/mongo-connect.php');
    require_once('includes/otel.php');

    echo "✓ Includes loaded\n";

    // Helper function (from the original file)
    function keyIsSet($key, $array) {
        return isset($array[$key]);
    }

    if (isset($_REQUEST["cmd"])) {
        $cmd = $_REQUEST["cmd"];
        if (function_exists('looma_trace_page')) {
            looma_trace_page('dictionary-utilities', [
                'cmd'  => $cmd,
                'word' => $_REQUEST['word'] ?? null,
                'lang' => $_REQUEST['lang']  ?? null,
            ]);
        }

        if ($cmd === 'lookup') {
            echo "\nRunning lookup...\n";
            $englishWord = trim($_REQUEST["word"]);
            $query = ['$or' => [
                ['en' => mongoRegexOptions("^$englishWord$",'i')],
                ['np' => mongoRegexOptions("^$englishWord$",'i')]
            ]];

            // Test WITH tracing
            echo "\n1. Test with looma_trace_with():\n";
            $word = function_exists('looma_trace_with')
                ? looma_trace_with('mongo.dictionary.lookup', [
                    'word' => $englishWord,
                    'collection' => 'dictionary',
                  ], function() use ($dictionary_collection, $query) {
                      return mongoFindOne($dictionary_collection, $query);
                  })
                : mongoFindOne($dictionary_collection, $query);

            if ($word != null) {
                echo "✓ Word found!\n";
                echo "  En: " . $word['en'] . "\n";
                if (isset($word['np'])) echo "  Np: " . $word['np'] . "\n";
                if (isset($word['def'])) echo "  Def: " . substr($word['def'], 0, 50) . "...\n";
                $json = json_encode($word);
                echo "  JSON length: " . strlen($json) . " bytes\n";
            } else {
                echo "✗ Word NOT found\n";
            }

            // Test WITHOUT tracing
            echo "\n2. Test WITHOUT looma_trace_with() (control):\n";
            $word2 = mongoFindOne($dictionary_collection, $query);
            if ($word2 != null) {
                echo "✓ Word found (no trace)\n";
                echo "  En: " . $word2['en'] . "\n";
            } else {
                echo "✗ Word NOT found (no trace)\n";
            }

            // Compare the results
            if ($word == $word2) {
                echo "\n✓ Results are identical!\n";
            } else {
                echo "\n⚠ Results differ!\n";
            }
        }
    }

} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

echo "\n=== Test Complete ===\n";
?>

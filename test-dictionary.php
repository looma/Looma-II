<?php
/**
 * Test script for diagnosing dictionary problems
 */

echo "=== Dictionary Utilities Test ===\n";
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Change to the right directory
chdir(__DIR__);
echo "Current directory: " . getcwd() . "\n";
echo "Script location: " . __DIR__ . "\n\n";

echo "\n1. Testing includes...\n";

// Check whether otel.php exists
if (file_exists('includes/otel.php')) {
    echo "✓ includes/otel.php exists\n";
    require_once('includes/otel.php');

    if (function_exists('looma_trace_with')) {
        echo "✓ looma_trace_with() function available\n";
    } else {
        echo "✗ looma_trace_with() NOT available\n";
    }

    if (function_exists('looma_trace_page')) {
        echo "✓ looma_trace_page() function available\n";
    } else {
        echo "✗ looma_trace_page() NOT available\n";
    }
} else {
    echo "✗ includes/otel.php does NOT exist\n";
}

echo "\n2. Testing mongo-connect.php...\n";
if (file_exists('includes/mongo-connect.php')) {
    echo "✓ includes/mongo-connect.php exists\n";
    require_once('includes/mongo-connect.php');

    if (isset($dictionary_collection)) {
        echo "✓ \$dictionary_collection is defined\n";
    } else {
        echo "✗ \$dictionary_collection is NOT defined\n";
    }
} else {
    echo "✗ includes/mongo-connect.php does NOT exist\n";
}

echo "\n3. Testing looma_trace_page()...\n";
$_REQUEST['cmd'] = 'lookup';
$_REQUEST['word'] = 'hello';

if (function_exists('looma_trace_page')) {
    looma_trace_page('dictionary-utilities-test', [
        'cmd'  => $_REQUEST['cmd'],
        'word' => $_REQUEST['word'],
    ]);
    echo "✓ looma_trace_page() ran without errors\n";
} else {
    echo "✗ looma_trace_page() not available\n";
}

echo "\n4. Testing looma_trace_with()...\n";
if (function_exists('looma_trace_with')) {
    try {
        $result = looma_trace_with('test.operation', ['test' => 'value'], function() {
            return ['status' => 'ok'];
        });
        echo "✓ looma_trace_with() ran without errors\n";
        echo "  Result: " . json_encode($result) . "\n";
    } catch (Exception $e) {
        echo "✗ Error in looma_trace_with(): " . $e->getMessage() . "\n";
    }
} else {
    echo "✗ looma_trace_with() not available\n";
}

echo "\n5. Testing the ternary operator with looma_trace_with()...\n";
if (function_exists('looma_trace_with')) {
    $test_value = true;
    $result = $test_value
        ? looma_trace_with('test.op', [], function() { return 'traced'; })
        : 'untraced';
    echo "✓ Ternary with looma_trace_with() working\n";
    echo "  Result: $result\n";
}

echo "\n=== Test Complete ===\n";
?>

<?php
/**
 * Test script para diagnosticar problemas no dicionário
 */

echo "=== Dictionary Utilities Test ===\n";
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Mudar para o diretório correto
chdir(__DIR__);
echo "Diretório atual: " . getcwd() . "\n";
echo "Script location: " . __DIR__ . "\n\n";

echo "\n1. Testando includes...\n";

// Testar se otel.php existe
if (file_exists('includes/otel.php')) {
    echo "✓ includes/otel.php existe\n";
    require_once('includes/otel.php');
    
    if (function_exists('looma_trace_with')) {
        echo "✓ looma_trace_with() função disponível\n";
    } else {
        echo "✗ looma_trace_with() NÃO disponível\n";
    }
    
    if (function_exists('looma_trace_page')) {
        echo "✓ looma_trace_page() função disponível\n";
    } else {
        echo "✗ looma_trace_page() NÃO disponível\n";
    }
} else {
    echo "✗ includes/otel.php NÃO existe\n";
}

echo "\n2. Testando mongo-connect.php...\n";
if (file_exists('includes/mongo-connect.php')) {
    echo "✓ includes/mongo-connect.php existe\n";
    require_once('includes/mongo-connect.php');
    
    if (isset($dictionary_collection)) {
        echo "✓ \$dictionary_collection está definida\n";
    } else {
        echo "✗ \$dictionary_collection NÃO está definida\n";
    }
} else {
    echo "✗ includes/mongo-connect.php NÃO existe\n";
}

echo "\n3. Testando looma_trace_page()...\n";
$_REQUEST['cmd'] = 'lookup';
$_REQUEST['word'] = 'hello';

if (function_exists('looma_trace_page')) {
    looma_trace_page('dictionary-utilities-test', [
        'cmd'  => $_REQUEST['cmd'],
        'word' => $_REQUEST['word'],
    ]);
    echo "✓ looma_trace_page() executado sem erros\n";
} else {
    echo "✗ looma_trace_page() não disponível\n";
}

echo "\n4. Testando looma_trace_with()...\n";
if (function_exists('looma_trace_with')) {
    try {
        $result = looma_trace_with('test.operation', ['test' => 'value'], function() {
            return ['status' => 'ok'];
        });
        echo "✓ looma_trace_with() executado sem erros\n";
        echo "  Resultado: " . json_encode($result) . "\n";
    } catch (Exception $e) {
        echo "✗ Erro em looma_trace_with(): " . $e->getMessage() . "\n";
    }
} else {
    echo "✗ looma_trace_with() não disponível\n";
}

echo "\n5. Testando ternary operator com looma_trace_with()...\n";
if (function_exists('looma_trace_with')) {
    $test_value = true;
    $result = $test_value
        ? looma_trace_with('test.op', [], function() { return 'traced'; })
        : 'untraced';
    echo "✓ Ternary com looma_trace_with() funcionando\n";
    echo "  Resultado: $result\n";
}

echo "\n=== Teste Concluído ===\n";
?>

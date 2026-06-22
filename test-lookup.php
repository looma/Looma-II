<?php
/**
 * Test script para testar lookup real
 */

echo "=== Dictionary Lookup Test ===\n";
error_reporting(E_ALL);
ini_set('display_errors', 1);

chdir(__DIR__);

// Simular uma requisição AJAX
$_REQUEST['cmd'] = 'lookup';
$_REQUEST['word'] = 'hello';

echo "Testando lookup para palavra: 'hello'\n";
echo "Diretório: " . getcwd() . "\n\n";

// Incluir o arquivo de utilities
try {
    require_once('includes/mongo-connect.php');
    require_once('includes/otel.php');
    
    echo "✓ Includes carregados\n";
    
    // Função auxiliar (do arquivo original)
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
            echo "\nExecutando lookup...\n";
            $englishWord = trim($_REQUEST["word"]);
            $query = ['$or' => [
                ['en' => mongoRegexOptions("^$englishWord$",'i')], 
                ['np' => mongoRegexOptions("^$englishWord$",'i')]
            ]];

            // Testar COM trace
            echo "\n1. Teste com looma_trace_with():\n";
            $word = function_exists('looma_trace_with')
                ? looma_trace_with('mongo.dictionary.lookup', [
                    'word' => $englishWord,
                    'collection' => 'dictionary',
                  ], function() use ($dictionary_collection, $query) {
                      return mongoFindOne($dictionary_collection, $query);
                  })
                : mongoFindOne($dictionary_collection, $query);

            if ($word != null) {
                echo "✓ Palavra encontrada!\n";
                echo "  En: " . $word['en'] . "\n";
                if (isset($word['np'])) echo "  Np: " . $word['np'] . "\n";
                if (isset($word['def'])) echo "  Def: " . substr($word['def'], 0, 50) . "...\n";
                $json = json_encode($word);
                echo "  JSON length: " . strlen($json) . " bytes\n";
            } else {
                echo "✗ Palavra NÃO encontrada\n";
            }

            // Testar SEM trace
            echo "\n2. Teste SEM looma_trace_with() (controle):\n";
            $word2 = mongoFindOne($dictionary_collection, $query);
            if ($word2 != null) {
                echo "✓ Palavra encontrada (sem trace)\n";
                echo "  En: " . $word2['en'] . "\n";
            } else {
                echo "✗ Palavra NÃO encontrada (sem trace)\n";
            }

            // Comparar resultados
            if ($word == $word2) {
                echo "\n✓ Resultados são idênticos!\n";
            } else {
                echo "\n⚠ Resultados diferem!\n";
            }
        }
    }
    
} catch (Exception $e) {
    echo "✗ Erro: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

echo "\n=== Teste Concluído ===\n";
?>

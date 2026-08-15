<?php
/*
 * firstaid-image-status.php — image progress tracker for the Health tab.
 * Lists every illustration slot (card / emergency / learn) per topic, shows a
 * thumbnail if the file exists in images/health/, or the caption + NEEDED badge
 * if not. Within-topic duplicate captions are marked REUSE. Read-only, no DB
 * writes. Open at: http://localhost:48080/firstaid-image-status.php
 */
header('Content-Type: text/html; charset=utf-8');

$seed = json_decode(@file_get_contents(__DIR__ . '/firstaid-seed.json'), true);
// seed shape: { _comment, config, topics: [ ... ] }  (topics carry no 'ft' field)
$topics = (is_array($seed) && isset($seed['topics'])) ? $seed['topics']
        : (is_array($seed) ? $seed : array());

function imgFor($id) {               // returns web path if a file exists, else ''
    foreach (array('png','webp','jpg','jpeg') as $ext) {
        $rel = "images/health/$id.$ext";
        if (is_file(__DIR__ . '/' . $rel)) return $rel . '?v=' . @filemtime(__DIR__ . '/' . $rel);
    }
    return '';
}
function ncap($s){ return preg_replace('/\s+/', ' ', trim(strtolower((string)$s))); }

// Build the flat slot list with reuse detection (per topic).
$rows = array(); $needGen = 0; $needCopy = 0; $done = 0; $uniqTotal = 0;
foreach ($topics as $t) {
    if (empty($t['id'])) continue;
    $id = $t['id']; $seen = array();
    $slots = array();
    if (!empty($t['illustration'])) $slots[] = array('Card', "$id", $t['illustration']);
    foreach (($t['emergency'] ?? array()) as $n => $s)
        if (!empty($s['illustration'])) $slots[] = array('E'.($n+1), "$id-emergency-".($n+1), $s['illustration']);
    foreach (($t['learn'] ?? array()) as $n => $c)
        if (!empty($c['illustration'])) $slots[] = array('L'.($n+1), "$id-learn-".($n+1), $c['illustration']);

    foreach ($slots as $sl) {
        list($label, $fname, $cap) = $sl;
        $key = ncap($cap);
        $reuseOf = isset($seen[$key]) ? $seen[$key] : '';
        if ($reuseOf === '') { $seen[$key] = $fname; $uniqTotal++; }
        $img = imgFor($fname);
        if ($img !== '') { $done++; }
        elseif ($reuseOf !== '') { $needCopy++; }
        else { $needGen++; }
        $rows[] = compact('id','label','fname','cap','reuseOf','img');
    }
}
$total = count($rows);
$pct = $total ? round($done * 100 / $total) : 0;
?>
<!doctype html>
<html><head><meta charset="utf-8"><title>First Aid images — status</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;margin:0;background:#0f1720;color:#e7edf3}
  header{position:sticky;top:0;background:#131e2a;padding:16px 24px;box-shadow:0 2px 8px rgba(0,0,0,.4);border-bottom:2px solid #23374a}
  h1{margin:0 0 6px;font-size:22px} .sub{color:#93a4b5;font-size:14px}
  .bar{height:12px;background:#22303f;border-radius:8px;overflow:hidden;margin:12px 0 4px;max-width:640px}
  .bar>i{display:block;height:100%;background:#1c8a3b;width:<?php echo $pct; ?>%}
  .legend{font-size:13px;color:#93a4b5}
  .legend b{color:#e7edf3}
  main{padding:20px 24px}
  h2{font-size:17px;margin:26px 0 10px;border-bottom:1px solid #23374a;padding-bottom:6px;text-transform:capitalize}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}
  .cell{background:#17222e;border:1px solid #23374a;border-radius:10px;overflow:hidden;display:flex;flex-direction:column}
  .thumb{aspect-ratio:1;background:#0d151d;display:flex;align-items:center;justify-content:center;text-align:center}
  .thumb img{width:100%;height:100%;object-fit:cover}
  .ph{padding:10px;font-size:12.5px;font-style:italic;color:#8aa0b4}
  .meta{padding:8px 10px;font-size:12px;line-height:1.35}
  .fn{font-family:monospace;font-size:11px;color:#b9c7d4;word-break:break-all}
  .tag{display:inline-block;font-size:11px;font-weight:bold;border-radius:5px;padding:2px 6px;margin-bottom:5px}
  .t-done{background:#173d24;color:#5fd98a} .t-need{background:#4a1d1d;color:#ff8f8f}
  .t-reuse{background:#3a3410;color:#e6cf5a}
  .label{font-weight:bold;color:#dfe8f0}
</style></head><body>
<header>
  <h1>First Aid images — status</h1>
  <div class="sub"><b><?php echo $done; ?></b> of <?php echo $total; ?> slots in place (<?php echo $pct; ?>%)</div>
  <div class="bar"><i></i></div>
  <div class="legend">
    <span class="tag t-need">NEEDED</span> generate <b><?php echo $needGen; ?></b> &nbsp;·&nbsp;
    <span class="tag t-reuse">REUSE</span> copy <b><?php echo $needCopy; ?></b> from a twin &nbsp;·&nbsp;
    <span class="tag t-done">DONE</span> <b><?php echo $done; ?></b>
    &nbsp;·&nbsp; unique images to generate: <b><?php echo $uniqTotal; ?></b>
  </div>
</header>
<main>
<?php
$curr = null;
foreach ($rows as $r) {
    if ($r['id'] !== $curr) { if ($curr!==null) echo "</div>"; $curr=$r['id'];
        echo "<h2>".htmlspecialchars(str_replace('-',' ',$curr))."</h2><div class='grid'>"; }
    echo "<div class='cell'><div class='thumb'>";
    if ($r['img'] !== '') {
        echo "<img src='".htmlspecialchars($r['img'])."' alt='' loading='lazy'>";
    } else {
        echo "<div class='ph'>".htmlspecialchars($r['cap'])."</div>";
    }
    echo "</div><div class='meta'>";
    echo "<span class='label'>".htmlspecialchars($r['label'])."</span> ";
    if ($r['img'] !== '')            echo "<span class='tag t-done'>DONE</span>";
    elseif ($r['reuseOf'] !== '')    echo "<span class='tag t-reuse'>REUSE</span>";
    else                             echo "<span class='tag t-need'>NEEDED</span>";
    echo "<div class='fn'>".htmlspecialchars($r['fname']).".png</div>";
    if ($r['reuseOf'] !== '' && $r['img'] === '')
        echo "<div class='fn'>↺ copy from ".htmlspecialchars($r['reuseOf']).".png</div>";
    echo "</div></div>";
}
if ($curr!==null) echo "</div>";
?>
</main></body></html>

<?php
/*
    Looma — which file delivers this chapter: the HTML one or the PDF?

    Usage:  looma-chapter-file.php?fp=../content/chapters/Class7/Science/en/&fn=7S02.pdf

    HTML ALWAYS WINS. A chapter can exist as both a .pdf and a .html; when it
    does, Looma opens the HTML. looma-chapters.php already applies that rule when
    it builds the chapter buttons, but chapters are opened from other places too
    (library search, lesson plans, the assistant), and those build a .pdf path in
    JavaScript without ever looking at the disk. LOOMA.playMedia() asks this
    endpoint before opening a chapter, so the rule holds everywhere instead of
    only on the chapters page.

    Returns:
        {"ok":true,"ft":"htmlchapter","fp":"...","fn":"7S02.html"}   HTML exists
        {"ok":true,"ft":"chapter","fp":"...","fn":"7S02.pdf"}        PDF fallback
*/

header("Content-Type: application/json");
header("Cache-Control: no-store");

$fp = isset($_REQUEST["fp"]) ? (string) $_REQUEST["fp"] : "";
$fn = isset($_REQUEST["fn"]) ? (string) $_REQUEST["fn"] : "";

function looma_chapter_file_answer($ft, $fp, $fn, $note = null)
{
    $out = ["ok" => true, "ft" => $ft, "fp" => $fp, "fn" => $fn];
    if ($note !== null) $out["note"] = $note;
    echo json_encode($out, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

// Anything unusable answers "chapter", i.e. leave the caller's PDF behaviour
// alone. This endpoint may only ever UPGRADE a chapter to HTML — never break the
// opening of one.
if ($fp === "" || $fn === "") {
    looma_chapter_file_answer("chapter", $fp, $fn, "missing fp/fn");
}

// The chapter folders live under ../content/chapters/. Refuse anything that
// tries to walk out of there: this reads the filesystem from a GET parameter.
$normalized = str_replace("\\", "/", $fp);
if (strpos($normalized, "..", 2) !== false          // any ".." beyond the leading "../"
    || strpos($normalized, "../content/") !== 0     // must start at the content root
    || strpos($fn, "/") !== false
    || strpos($fn, "\\") !== false
    || strpos($fn, "..") !== false) {
    looma_chapter_file_answer("chapter", $fp, $fn, "path not allowed");
}

// "7S02.pdf" -> "7S02"; a name that is already .html needs no work.
if (preg_match('/\.html?$/i', $fn)) {
    looma_chapter_file_answer("htmlchapter", $fp, $fn);
}
$base = preg_replace('/\.pdf$/i', '', $fn);

// __DIR__ is the Looma folder; the "../content/..." the frontend uses is
// relative to exactly that, so the two agree.
$dir = __DIR__ . "/" . rtrim($normalized, "/") . "/";

foreach ([".html", ".htm"] as $ext) {
    if (is_file($dir . $base . $ext)) {
        looma_chapter_file_answer("htmlchapter", $fp, $base . $ext);
    }
}

looma_chapter_file_answer("chapter", $fp, $fn);

<?php
/*
    The floating LOOMA Assistant button + its chat modal (see
    js/looma-assistant-button.js, includes/looma-assistant-modal.php).

    Included from THREE places that never all appear on the same page at once
    in practice (includes/toolbar.php, includes/toolbar-vertical.php,
    includes/looma-control-buttons.php) so the assistant is reachable
    regardless of which of those a given page happens to use — some pages mix
    two of them (e.g. a viewer page has both the nav toolbar and the floating
    control buttons). The guard below makes that safe: only the first include
    on a given page actually renders anything.
*/
if (!defined('LOOMA_ASSISTANT_WIDGET_RENDERED')) {
    define('LOOMA_ASSISTANT_WIDGET_RENDERED', true);
?>
    <button class = "looma-assistant           looma-control-button">
        <?php tooltip("LOOMA Assistant") ?>
    </button>

    <?php include ('includes/looma-assistant-modal.php'); ?>
<?php
}

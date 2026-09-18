<?php
/*
    The LOOMA Assistant chat modal (see js/looma-assistant-button.js,
    includes/looma-assistant-modal.php). The clickable trigger is a normal
    toolbar button (class "looma-assistant", same click hook) in
    includes/toolbar.php / toolbar-vertical.php — it used to be a floating
    button rendered from here, but that put it on top of page content instead
    of in the main menu. This include now only provides the modal.

    Included from THREE places that never all appear on the same page at once
    in practice (includes/toolbar.php, includes/toolbar-vertical.php,
    includes/looma-control-buttons.php) so the modal exists regardless of
    which of those a given page happens to use. The guard below makes
    including it more than once on a page safe: only the first include
    actually renders anything.
*/
if (!defined('LOOMA_ASSISTANT_WIDGET_RENDERED')) {
    define('LOOMA_ASSISTANT_WIDGET_RENDERED', true);
?>
    <?php include ('includes/looma-assistant-modal.php'); ?>
<?php
}

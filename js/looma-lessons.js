function playActivity(event) {
    var button = event.currentTarget;
    LOOMA.playMedia(button);
};

$(document).ready (function() {
    $("button.play").click(playActivity);
});
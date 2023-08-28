/*
LOOMA javascript file
Filename: looma-play-slideshow.js
Description: supports looma-play-slideshow.php

Programmer name: Kiefer
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: Aug 2018
Revision: Looma 4.0
 */

'use strict';

var isFullScreen = false;

function insertCaption($item) {
   // $('#viewer').css('height', '100%');
	if ($item.attr('data-ft') === "text") { $('.caption').hide();}
	else { if ($item.attr('data-dn') && $item.attr('data-dn') !== "")  //note slideshow editor stores the CAPTION for a slide in 'data-url' of the Activity Button for the slide
        {   $('.caption').text($item.attr('data-dn'));
            //$('#viewer').css('height', '93%');
            $('.caption').show();
		} else {
			$('.caption').text('');
			$('.caption').hide();
		}
	}
} //end insertCaption()

/*
function showControlButtons() {
	$('#forward-back-div').toggle();
	$('#forward').toggle();
	$('#back').toggle();
};
*/

/////////////////////////// SORTABLE UI ////////  requires jQuery UI  ///////////////////
var makesortable = function() {
    //$('timelineDisplay').sortable( "destroy" ); //remove previous sortable state
    $("#timeline").sortable({
        opacity: 0.7,   // makes dragged element transparent
        revert: true,   //Animates the drop
        axis:   "x",
        scroll: true,   //Allows page to scroll when dragging. Good for wide pages.
        handle: $(".slideshow-element")  //restricts elements that can be clicked to drag to .timelinediv's
    }).disableSelection();
};

window.onload = function() {
    var $timeline = $('#timeline');
    
    var playing;
    var autotimer;
    var autoplaying = false;
    
    var $currentItem;
    var $mediaContainer = $(".media-container");
    
	$('.caption').show();
	$('#forward-back-div').hide();  //NOT USED
	$('.activity').removeClass('activity play img').addClass(
	'slideshow-element');
	
	var fullscreenPlayPauseButton = document.getElementById("fullscreen-playpause");
	$('#fullscreen-playpause').click(function(){
		if (!autoplaying) {
			autoplaying = true;
			$('#fullscreen-playpause').css('background-image', 'url("images/pause.png")');
			autotimer = setInterval(function () {
				if ($currentItem.next().data('ft'))
					play($currentItem.next());
				else {
				autoplaying = false;
				$('#fullscreen-playpause').css('background-image', 'url("images/video.png")');
				clearInterval (autotimer);
				play($('#timeline').find('button:last'));
				}}, 3000);
		} else {
			autoplaying = false;
			$('#fullscreen-playpause').css('background-image', 'url("images/video.png")');
			clearInterval (autotimer);
		}
	});
	
	$('button#speak').click(function(){
		var toString = window.getSelection().toString();
		 console.log ('selected text to speak: "', toString, '"');
		 LOOMA.speak(toString);
	});
	
    makesortable(); //makes the timeline sortable
	
	// handlers for 'control panel' buttons
	$('#back, #prev-item').click(function(e) {
		e.preventDefault();
		
		if ($currentItem.prev().data('ft')) {
			play($currentItem.prev());
		} //else pause();
	});
	$('#forward, #next-item').click(function(e) {
		e.preventDefault();
		
		if ($currentItem.next().data('ft')) {
			play($currentItem.next());
		}// else pause();
	});
    
    // enable right and left arrow keys to do forward and back on timeline
    $('body').keydown(function(e) {
        if (e.which === 37) {
            e.preventDefault();
            if ($currentItem.prev().data('ft')) play($currentItem.prev());
        }
        else if (e.which === 39 ) {
            e.preventDefault();
            if ($currentItem.next().data('ft')) play($currentItem.next());
        }
    });
    
   /* $('#pause').click(function() {
		if (playing) pause();
		else play($currentItem);
	});*/
 
	$('#return').click(function() {
		parent.history.back();
	});

	$timeline.on('click', 'button', function() {
		var $btn = $(this).closest('button');
		
		if ($btn.attr('data-ft')) {
			play($(this));
			insertCaption($btn);
		}
	});
    
    $('span.tip').removeClass('yes-show');
    $('span.tip').removeClass('big-show');
	
	$('.slideshow-element').hover(
			function() { //handlerIn
				var $btn = $(this).closest('button');
				$('#subtitle').text($btn.attr('data-dn') + ' (' +
                    LOOMA.typename($btn.attr('data-ft')) + ')');
			},
			function() { //handlerOut
				$('#subtitle').text('');
			}
	);

	// create HTML for various players for filetypes

	var $imageHTML = $(makeImageHTML());

	play($('#timeline').find('button:first')); // automatically "play" the first item
	//insertCaption($('#timeline').find('button:first'));

	function scrollTimeline($btn) {
		$('#timeline-container').animate({scrollLeft: $btn.outerWidth(true) * ($btn.index() - 2)}, 700);

        //$('#timeline-container').scrollLeft($btn.outerWidth(true) * ($btn.index() - 2));
        
	}
/*
	function pause() {
		playing = false;
		//$timeline.fadeIn(500);
		$('#pause').css('background-image', 'url("images/play-button.png")');
	}; //end pause()
*/
	function play($item) {
		$mediaContainer.empty();
		$currentItem = $item;
		playing = true;
		insertCaption($item);
		$('#timeline button').removeClass('playing');
		$item.addClass('playing');
		scrollTimeline($item);
		//$('#pause').css('background-image', 'url(" images/pause-button.png")');
		//$timeline.fadeOut(500);  //this hides the timeline when playing media - decided to not hide the timeline [usability]

		playActivity($item.data('ft'), $item.data('fn'), $item.data('fp'),
				$item.data('dn'), $item.data('id'), "", $item.data('pg'));

	} //end play()

	function playActivity(ft, fn, fp, dn, id, ch, pg) {
	    //play the activity of type FT, named FP, in path FP, display-name DN
		// plays the selected (onClick) timeline element (activity) in the $mediaContainer div

		//restoreFullscreenControl(); //reset fullscreen operation in case video, which overrides normal fullscreen operation, has run

		switch (ft) {
		case "image":
		case "jpg":
		case "png":
		case "gif":

			$imageHTML.attr('src', fp + fn);
			$imageHTML.appendTo($mediaContainer);
			break;

		case 'text':

			textHTML(id);
			break;

		default:
			console.log("ERROR: in playActivity(), unknown type: " + ft);
		break;
		} //end SWITCH(ft)
	} //end playActivity()

	function makeImageHTML() { return ('<img src="">'); }
	
	function textHTML(id) {
		$.post("looma-database-utilities.php", {
			cmd: "openByID",
			collection: 'activities',
			id: id
		},
		function(result1) {
			$.post("looma-database-utilities.php", {
				cmd: "openByID",
				collection: 'text',
				id: result1.mongoID.$oid
			},
			function(result2) {
                
                
                var $div = $('<div ' +
                    'class="text-display">');
                
                var native = (result2.nepali) ? result2.nepali : result2.data;
                var html = '<div class="english">' + result2.data + '</div><div class="native" style="display:none;">' + native + '</div>';
                
                $div.html(html).appendTo($mediaContainer);
                LOOMA.translate(language);
			    
			    
			// // //     $('<div class="text-display">').append($(result2.data)).appendTo($mediaContainer);
			
				},
			'json'
			);
		},
		'json'
		);
	}
}; //end window.onload

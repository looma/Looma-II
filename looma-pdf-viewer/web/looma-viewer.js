/*********************
* Author: Shannon
* Owner: VillageTech Solutions (villagetechsolutions.org)
* Date: 2016 06
* File: viewer-looma.js
* This file overrides certain variables and functions in the original viewer.js
* Currently, it does the following:
* - highlights the Hand Tool when selected
* - renders thumbnails of each bookmarked page appear in the Outline View
* 
* Known bugs:
* - canvases in outline view sometimes don't render properly and 
*   only display a blank page
* - pdf loads more slowly
*********************/


// overrode original HandTool in viewer.js to make it highlighted when it is active 
// and unhighlighted when inactive
// Most of the code in this function is identical to the original except where indicated in comments
var HandTool = {
  initialize: function handToolInitialize(options) {
    var toggleHandTool = options.toggleHandTool;
    this.handTool = new GrabToPan({
      element: options.container,
      onActiveChanged: function(isActive) {
        if (!toggleHandTool) {
          return;
        }
        if (isActive) {
          toggleHandTool.title =
            mozL10n.get('hand_tool_disable.title', null, 'Disable hand tool');
          /*************************/
          toggleHandTool.classList.add("toggled"); // added code
          /************************/
          toggleHandTool.firstElementChild.textContent =
            mozL10n.get('hand_tool_disable_label', null, 'Disable hand tool');
        } else {
          toggleHandTool.title =
            mozL10n.get('hand_tool_enable.title', null, 'Enable hand tool');
          /*************************/
          toggleHandTool.classList.remove("toggled"); // added code
          /*************************/
          toggleHandTool.firstElementChild.textContent =
            mozL10n.get('hand_tool_enable_label', null, 'Enable hand tool');
        }
      }
    });
    if (toggleHandTool) {
      toggleHandTool.addEventListener('click', this.toggle.bind(this), false);

      window.addEventListener('localized', function (evt) {
        Preferences.get('enableHandToolOnLoad').then(function resolved(value) {
          if (value) {
            this.handTool.activate();
          }
        }.bind(this), function rejected(reason) {});
      }.bind(this));
    }
  },

  toggle: function handToolToggle() {
    this.handTool.toggle();
    SecondaryToolbar.close();
  },

  enterPresentationMode: function handToolEnterPresentationMode() {
    if (this.handTool.active) {
      this.wasActive = true;
      this.handTool.deactivate();
    }
  },

  exitPresentationMode: function handToolExitPresentationMode() {
    if (this.wasActive) {
      this.wasActive = null;
      this.handTool.activate();
    }
  }
};


/*********Code to make thumbnails appear in table of contents (called outlineview)************/

/************************
* Code to render the canvas. 
************************/
var pdfDoc = null, 
pageNum = 1,
pageRendering = false,
pageNumPending = null;

function renderCanvas(num, canvas, width, height) {
  var ctx = canvas.getContext('2d');

  pageRendering = true;
  // Using promise to fetch the page
  pdfDoc.getPage(num).then(function(page) {
    canvas.width = width;
    canvas.height = height;
    var scale = width / page.getViewport(1).width;
    var viewport = page.getViewport(scale);
    
    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    var renderTask = page.render(renderContext);
    // Wait for rendering to finish
    renderTask.promise.then(function () {
      pageRendering = false;
      if (pageNumPending !== null) {
      // New page rendering is pending
      renderPage(pageNumPending);
      pageNumPending = null;
      }
    });  //end inner "then" function
  }); // end "then" anonymous function
}  

function showCanvas(pg, doc, canvas, width, height) {
  PDFJS.getDocument(doc).then(function (pdfDoc_) {
  pdfDoc = pdfDoc_;
  pageNum = parseInt(pg);
  // Initial/first page rendering
  renderCanvas(pageNum, canvas, width, height);
  }); 
}; 
/********* end canvas rendering code **********/


/*
* Added code to override original DocumentOutlineView in viewer.js
* This modified version makes the thumbnail of each bookmarked page
* appear in the sidebar when OutlineView is selected.
*/

var DocumentOutlineView = function documentOutlineView(options) {
  var outline = options.outline;
  var outlineView = options.outlineView;
  while (outlineView.firstChild) {
    outlineView.removeChild(outlineView.firstChild);
  }

  if (!outline) {
    return;
  }

  var linkService = options.linkService;

  function bindItemLink(domObj, item) {
    domObj.href = linkService.getDestinationHash(item.dest);
    domObj.onclick = function documentOutlineViewOnclick(e) {
      linkService.navigateTo(item.dest);
      return false;
    };
  }

  var queue = [{parent: outlineView, items: outline}];
  while (queue.length > 0) {
    var levelData = queue.shift();
    var i, n = levelData.items.length;
    for (i = 0; i < n; i++) {
      var item = levelData.items[i];
      var div = document.createElement('div');
      div.className = 'outlineItem';
      var a = document.createElement('a');
      bindItemLink(a, item);
      /*****************************
      * Added code to show thumbnails in outline. To restore to original,
      * delete everything between the '/********'s  and uncomment 
      * a.textContent = item.title;
      *****************************/
      // gets the page number of the outline entry and stores it in id
      var destRef = item.dest[0]; // see navigateTo method for dest format
      var id = destRef instanceof Object ?
        linkService.pagesRefMap[destRef.num + ' ' + destRef.gen + ' R'] :
        (destRef + 1);

      // var renderingQueue = this.renderingQueue;
      this.renderingId = 'thumbnail' + id;

      this.pdfPage = null;
      this.rotation = 0;
      // this.renderingQueue = renderingQueue;

      this.hasImage = false;
      this.resume = null;
      this.renderingState = RenderingStates.INITIAL;

      //gets the dimensions for the canvas from the corresponding 
      //  thumbnail of the page
      this.canvasWidth = 
        linkService.pdfThumbnailViewer.thumbnails[id-1].canvasWidth;
      this.canvasHeight = 
        linkService.pdfThumbnailViewer.thumbnails[id-1].canvasHeight;


      var thumbDiv = document.createElement('div');
      thumbDiv.id = 'outlineThumbnailContainer' + id;
      thumbDiv.className = 'outlineThumbnail';
      this.thumbDiv = thumbDiv;
        
      var ring = document.createElement('div');
      ring.className = 'thumbnailSelectionRing';
      var borderAdjustment = 2;
      ring.style.width = this.canvasWidth + borderAdjustment + 'px';
      ring.style.height = this.canvasHeight + borderAdjustment + 'px';
      this.ring = ring;
        
      
      /*
      * Draw actual thumbnail
      */
      // var canvas = document.getElementById('thumbnail' + id);
      var canvas = document.createElement('canvas');
      canvas.id = "thumbnail" + id;
      showCanvas(id, linkService.url, canvas, this.canvasWidth, this.canvasHeight);

      // Do we need to show the selection rings? 
      ring.appendChild(canvas);
      thumbDiv.appendChild(ring);
      a.appendChild(thumbDiv);
      outlineView.appendChild(a)

      var title = document.createElement('p');
      title.textContent = item.title;
      ring.appendChild(title);
      /*****************************/
      // a.textContent = item.title;
      div.appendChild(a);

      if (item.items.length > 0) {
        var itemsDiv = document.createElement('div');
        itemsDiv.className = 'outlineItems';
        div.appendChild(itemsDiv);
        queue.push({parent: itemsDiv, items: item.items});
      }

      levelData.parent.appendChild(a);
    }
  }
};


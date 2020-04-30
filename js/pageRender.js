
      doc.getPage(page);).then(function(page) {
                var renderTask = null;
            
                function renderPage() {
                    if ( renderTask !== null ) {renderTask.cancel();return;}
                
                    var viewport = page.getViewport(1, 0);
            renderTask = page.render({
                        canvasContext: canvasContext,
                        viewport: viewport,
                    });
                
            renderTask.then(function () {renderTask = null;})
                        .catch(function(err) {
                        
                            renderTask = null;
                            if ( err.name === 'RenderingCancelledException' ) {
                                renderPage();return;
                            }
                            
                            console.log('Page render error', err);
                        });
                }
          renderPage();
                renderPage();
            
            });
        

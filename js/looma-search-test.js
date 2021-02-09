/*
LOOMA javascript file
Filename: looma-search.js
Description: supports includes/looma-search.php

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: Nov 16
Revision: Looma 2.4

Comments:
 */

'use strict';

/*define functions here */

$(document).ready(function ()
    {
        // SHOW the search panel
        $('#search-open').click( function() {$('#search-panel').show();});

        // SHOW the search filters that we want:
        // available filters are '#search-filter, #sort-criteria, #search-criteria, #class-subj-filter'
        $('#search-filter, #sort-criteria, #search-criteria, #class-subj-filter').show();

        // also SHOW checkboxes in #search-filter that we want
        // available checkboxes are  #vid-chk', #aud-chk, #img-chk,  #pdf-chk', #txt-chk, #template-chk, #txb-chk, #vid-chk', #game-chk, #ss-chk'
        $('#txt-chk, #vid-chk, #vid-chk, #aud-chk, #img-chk,  #pdf-chk, #txt-chk, #template-chk, #txb-chk, #vid-chk, #game-chk, #ss-chk').show();

       $('#cancel-search').show();

    });

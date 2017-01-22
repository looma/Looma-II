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

/* used by looma-search.php which can be included in any Looma page to give search functionality */

/* the various search elements can be customized, shown or hidden by the JS of the page using looma-search.php*/
                   // SHOW the search elements that we want:
                    // for instance: $('#search-filter, #sort-criteria, #search-criteria, #class-subj-filter').show();
                    // also SHOW checkboxes in #search-filter that we want
                    //for instance: $('#txt-chk, #vid-chk').show();

//open a file browse/search panel
function opensearch() {
        //make the main page transparent
        LOOMA.makeTransparent($('#main-container-horizontal'));
        LOOMA.makeTransparent($('#commands'));
        $('#cmd-btn').prop('disabled', true);
        // show SEARCH panel
        $('#search-panel').show();
        $('#search-filter, #search-criteria').show();
        $('#search-bar input').focus();
        $('#cancel-search').show();

        //hide all type checkboxes - local code will show() the ones we want
        $('.typ-chk').attr('checked', false).hide(); //hide all type checkboxes - local code will show() the ones we want

        callbacks['showsearchitems']();
}; //end opensearch()

//close the file search panel
function closesearch() {
        $('#search-panel').hide();
        $('#search-results').hide();
        $('#search-results').off('click', 'button');  //remove ON CLICK handler for #search-results button
        $('#main-container-horizontal').removeClass('all-transparent');
        $('#commands'                 ).removeClass('all-transparent');
        $('#cmd-btn').prop('disabled', false);

        //$('.typ-chk').off('click').attr('checked', false).hide();
        $('.typ-chk input').off('click');
        $('.typ-chk input').attr('checked', false);
        $('.typ-chk').hide();

        $('#search-bar input').val('');
};  //end closearch()

function displayFileSearchResults(results)
    {
        var $display = $('#search-results').empty().append('<table></table>');

        if (results.length == 0) { //print empty button

            $display.append(
                     "<tr><td>" +
                          "<button id='cancel-results'>" +
                             "<h4> <b> No files found - Cancel</b> </h4>" +
                          "</button>" +
                      "</td></tr>"
                ).show();
            }
        else {
            $.each(results, function(index, value) {
                $display.append(
                     "<tr><td>" +
                         "<button class='result' " +
                            "data-id='" + value['_id']['$id'] + "' " +
                            "title='" + value['dn'] + "'>" +
                                "<h4> <b> " + value['dn'] + " </b> </h4>" +
                                "<h6> Author: " + value['author'] + " " + value['date'] + "</h6>" +
                                "<div class='result-data'>" + value['data'] + "</div>" +
                            "</button>" +
                     "</td</tr>"
            ).show();
           });
        };
    }; //end displayFileSearchResults()

    $(document).ready(function ()
        { $('#search-form').submit(function( event ) {
                  event.preventDefault();
                  $.post( "looma-database-utilities.php",
                           $( "#search-form" ).serialize(),
                           function (result) {
                                displayFileSearchResults(result);return;},
                           'json');
            });
        });

/*
 *File: looma-dictionary-autogen-uniquewords.js
 *Authors: Nikhil Singhal and Colton Conley
 *Date: July 28, 2016
 *
 * This file contains two useful functions that help to separate out words from parsed PDF
 * text, determine their ch_ids with help from user input, and return them as an array of
 * objects
 *
 * NOTE: JUN 2018 (Skip)  this code doesnt know how to autogenerate Unit numbers, only Chapter numbers
 *      because it doesnt know where unit breaks are ( e.g. from 4SS01.09 to 4SS02.01)
 */


/**
 * Finds unique words and their chapter IDs from parsed PDF text
 * @param pages An array of strings, each corresponding to the text from a PDF page
 * @param isChPre True if the helpString is a word that separates chapters such as "Lesson".
 * False if it is a comma separated list of page numbers
 * @param helpString  Either a word that separates chapters or a comma separated list of page
 * numbers
 * @param prefix The ch_id prefix used before all parsed chapter numbers
 * @param start The page (in the PDF) to start looking for words
 * @param end The page (in the PDF) to stop looking for words
 */
function findUniqueWordsFromString(pages, isChPre, helpString, prefix, start, end){
    // get only words
    pages = pages.map(extractWordsFromString); // string[][]
    
    // make sure start and end are defined
    start = start || 1;
    end = end || pages.length;
    
    var words = [];
    if(helpString == "") {  // no chapters, don't add numbers just use the prefix
        for(var i = start - 1; i < end; i++) {
            for(var j = 0; j < pages[i].length; j++) {
                words.push({"word": pages[i][j], "ch_id": prefix});
            }
        }
    } else if(isChPre) { //autogenerate ch_id's
        // parse through to find helpstring followed by numbers to find chapter markers
        if(start != 1 || end != pages.length) {
            return false; // fail
        }
        helpString = helpString.trim().toLowerCase();
        var chapter = 0;
        var lastWasPrefix = false;
        var contents = true;
        
        for(var i = 0; i < pages.length; i++) {
            words = words.concat(pages[i]);
        }
        for(var i = 0; i < words.length; i++) {
            if(lastWasPrefix) {
                if(parseInt(words[i]) == chapter + 1) {
                    chapter++;
                } else if(parseInt(words[i]) == 1){
                    // exit contents section
                    chapter = 1;
                    contents = false;
                }
            }
            lastWasPrefix = (words[i] == helpString);
            words[i] = {"word": words[i], "ch_id": prefix + (contents ? "00" : (chapter < 10 ? "0" : "") + chapter)};
        }
    }  //end autogenerate ch_id's
    else {   // switch chapters when the next page number comes up.
        var chapter = 0;
        var pageNums = helpString.split(",").map(function(num) {
            return parseInt(num.trim());
        });
        var pageIndex = 0;
        for(var i = 0; i < pages.length; i++) {
            if(pageNums[pageIndex] == i + 1) {
                chapter++;
                pageIndex++;
            }
            
            // only add if its in the page range
            if(i >= start - 1 && i < end) {
                for(var j = 0; j < pages[i].length; j++) {
                    words.push({"word": pages[i][j], "ch_id": prefix + (chapter < 10 ? "0" : "") + chapter});
                }
            }
        }
    }
    // sort the words
    var sorted = words.sort(function(a, b) {
        if(a.word == b.word) {
            if(a.ch_id <= b.ch_id) {
                return -1;
            } else {
                return 1;
            }
        } else if(a.word < b.word) {
            return -1;
        } else {
            return 1;
        }
    });
    
    // remove a word followed by a duplicate. This will make sure the words are unique
    return sorted.filter( function(v,i,o){return !/(0|[1-9]\d*)/.test(v.word) && (i==0 || v.word!=o[i-1].word);});
}

/**
 * Finds and extracts all words from a string, where words can only be comprised of latin
 * letters and arabic numeral digits
 * @param string The string to extract from
 * @returns The list of words, all lowercase, from the string.
 */
function extractWordsFromString(string) {   // NOTE: change to [a-z,A-Z] or \w format for regex used here
    return (string.match(/[qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789]+/g) || [])
        .map(function(word) { return word.toLowerCase()});
}

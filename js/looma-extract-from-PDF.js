/*
Author: Charlotte, Skip, async5 on stackoverflow
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: Summer 2021
Revision: Looma 6.4

filename: looma-extract-from-PDF.js
*/
'use strict';

var startPn;
var endPn;
var startFound;
var endFound;
var ch_id;
var thisWord;
var isValid;

// temporary: user must fill in chapter id here
// in this case, 1EN01.00
var grade = "1";
var subject = "EN";
var chapter = "02";
var subchapter = ".00" // optional

main();

function main() {
    
    startFound = false;
    endFound = false;
    
    ch_id = grade + subject + chapter + subchapter;
    console.log("working with " + ch_id);
    
    // find starting page number corresponding to the current ch_id
    LOOMA.dictionaryLookupCh_id(ch_id, success1, fail);
    
    // find starting page number corresponding to the following ch_id
    var chapter2 = "";
    if (chapter.substr(0, 1) == "0") {
        chapter2 += "0";
    }
    chapter2 += String(parseInt(chapter) + 1);
    var ch_id2 = grade + subject + chapter2 + subchapter;
    LOOMA.dictionaryLookupCh_id(ch_id2, success2, fail);
    
    // extract text from the pdf starting at startPn and ending at endPn
    waitUntilDone();
    function waitUntilDone() {
        if (!startFound || !endFound) {
            // wait until start and end pn have been found
            setTimeout(function(){waitUntilDone()},100);
        }
        else {
            console.log("start page: " + startPn);
            console.log("end page: " + endPn);
            extractText();
        }
    }
}

// success and fail functions
function fail(jqXHR, textStatus, errorThrown) {
    alert("function fail");
    console.log('jqXHR is ' + jqXHR.status);
    window.alert('failed with textStatus = ' + textStatus);
    window.alert('failed with errorThrown = ' + errorThrown);
}
function success1(num) {
    startPn = num;
    startFound = true;
}
function success2(num) {
    endPn = num;
    endFound = true;
}
function doNothing() {}

// to check if a character should be included in the words arrray
function isLetter(str) {
    if (str.match(/[a-z]/i) || str == "’") {
        return true;
    }
    return false;
}

// splits the strings into words
// adds unique words to an array
function splitToWords(allText) {
    var words = [];
    var indexStart;
    var indexEnd; // exclusive
    var found1;
    var found2;
    for (var i = 0; i < allText.length; i++) {
        var string = allText[i].toLowerCase();
        indexStart = 0;
        found1 = true;
        found2 = false;
        for (var j = 1; j < string.length; j++) {
            if (!isLetter(string[j-1]) && isLetter(string[j])) {
                indexStart = j;
                found1 = true;
            }
            else if (isLetter(string[j-1]) && !isLetter(string[j])) {
                indexEnd = j;
                found2 = true;
            }
            else if (j == string.length - 1) {
                indexEnd = j;
                found2 = true;
            }
            
            if (found1 && found2) {
                var word = string.slice(indexStart, indexEnd);
                if (!words.includes(word)) {
                    words.push(word);
                }
                found1 = false;
                found2 = false;
            }
        }
    }
    console.log(words);
    
    // for each word, add an entry to the collection
    for (var n = 0; n < words.length; n++) {
        addToCollection(words[n]);
    }
}

// call the function to add words and their corresponding ch_id to the chapterIDs collection
function addToCollection(word) {
    // send request to the WordsAPI
    const fetchResult = {
        "async": true,
        "crossDomain": true,
        "url": "https://wordsapiv1.p.rapidapi.com/words/" + word + "/definitions",
        "method": "GET",
        "headers": {
            // get API key at https://rapidapi.com/dpventures/api/wordsapi/
            "x-rapidapi-key": "cqqY5oQ2rbmshPgy4no7CAxRV3K9p14Wi11jsn53JZQ0WNmeaL", // <-- NOTE: must fill this in with the rapidapi key for this to work
            "x-rapidapi-host": "wordsapiv1.p.rapidapi.com"
        }
    };
    
    $.ajax(fetchResult).done(function (response) {
        LOOMA.dictionaryAddCh_id(ch_id, word);
    })
    return;
}

// Code from async5 on https://stackoverflow.com/questions/40635979/how-to-correctly-extract-text-from-a-pdf-using-pdf-js
function extractText() {
    var PDF_URL = 'English-1-2465.pdf';
    pdfjsLib.getDocument(PDF_URL).then(function (pdf) {
        var pdfDocument = pdf;
        // Create an array that will contain our promises
        var pagesPromises = [];
        
        for (var i = startPn - 1; i < endPn - 1; i++) {
            (function (pageNumber) {
                // Store the promise of getPageText that returns the text of a page
                pagesPromises.push(getPageText(pageNumber, pdfDocument));
            })(i + 1);
        }
        
        // Execute all the promises
        Promise.all(pagesPromises).then(function (pagesText) {
            
            // Display text of all the pages in the console
            // e.g ["Text content page 1", "Text content page 2", "Text content page 3" ... ]
            console.log(pagesText);
            splitToWords(pagesText);
            
        });
        
    }, function (reason) {
        // PDF loading error
        console.error(reason);
    });
}
/**
 * Retrieves the text of a specif page within a PDF Document obtained through pdf.js
 *
 * @param {Integer} pageNum Specifies the number of the page
 * @param {PDFDocument} PDFDocumentInstance The PDF document obtained
 **/
function getPageText(pageNum, PDFDocumentInstance) {
    // Return a Promise that is solved once the text of the page is retrieven
    return new Promise(function (resolve, reject) {
        PDFDocumentInstance.getPage(pageNum).then(function (pdfPage) {
            // The main trick to obtain the text of the PDF page, use the getTextContent method
            pdfPage.getTextContent().then(function (textContent) {
                var textItems = textContent.items;
                var finalString = "";
                
                // Concatenate the string of the item to the final string
                for (var i = 0; i < textItems.length; i++) {
                    var item = textItems[i];
                    
                    finalString += item.str + " ";
                }
                
                // Solve promise with the text retrieven from the page
                resolve(finalString);
            });
        });
    });
}
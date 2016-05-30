// requires useful-functions.js

/**
* 
* This script enables text with the class attribute 'text' in webpages to be translated by 
* the translate button in footer.html. 
* 
*/
var currentLang;
var xmlDoc;
var toEngXML = "xml/Nepali2English.xml";
var tonativeXML = "xml/English2Nepali.xml";
var XMLtag = 'entry'
var XMLattribute = 'translation';

/*
* Finds the matching translation for 'text' in the XML
* @param text: the text to be translated
*/
function getElementByAttribute(text)
{
	tags = xmlDoc.getElementsByTagName(XMLtag);
	index = -1
	//finds the appropriate entry containing the corresponding translation
	for(k = 0; k < tags.length; k++)
	{
		if(tags[k].getAttribute(XMLattribute) == text)
		{
			index = k;
			break;
		}
	}
	return tags[index].childNodes[0].nodeValue;
}

/*
* Translates the innerHTML of all elements with the class attribute 'text' into 
* the language that currentLang is currently set to.
*/
function loadLang()
{
	var lang = document.getElementById("footer").contentWindow.localStorage.currentLang;
	currentLang = lang;
	//loadXMLDoc is a function in useful-functions.js
	if(currentLang == 'English')
		x = loadXMLDoc(toEngXML);
	else
		x = loadXMLDoc(tonativeXML);
	xmlDoc = x.responseXML;

	elements = document.getElementsByClassName("text");
	for(i = 0; i < elements.length; i++)
	{
		elements[i].innerHTML = getElementByAttribute(elements[i].innerHTML);
	}
	
}
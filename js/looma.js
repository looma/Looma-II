/*
 * Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: looma.js
Description:
 */

'use strict';

/*  //removed use of screenfull.js JAN 2019 because it fails in Chrome rel 71
function restoreFullscreenControlOLD () {
    $('#fullscreen-control').off('click').on('click', function (e) {
        e.preventDefault();
        //LOOMA.toggleFullscreen();
        var fs =      document.getElementById('video-fullscreen');
        if (!fs) fs = document.getElementById('fullscreen');
        screenfull.toggle(fs);
    }); //end fullscreen
};
*/

var language;

var PreetiToUnicode = {"Preeti":{"version":"v0.01","rules":{"character-map":{"0":"ण्","1":"ज्ञ","2":"द्द","3":"घ","4":"द्ध","5":"छ","6":"ट","7":"ठ","8":"ड","9":"ढ","~":"ञ्","!":"१","@":"२","#":"३","$":"४","%":"५","^":"६","&":"७","*":"८","(":"९",")":"०","_":")","+":"ं"," ":" ","`":"ञ","-":"(","=":".","Q":"त्त","W":"ध्","E":"भ्","R":"च्","T":"त्","Y":"थ्","U":"ग्","I":"क्ष्","O":"इ","P":"ए","}":"ै","|":"्र","q":"त्र","w":"ध","e":"भ","r":"च","t":"त","y":"थ","u":"ग","i":"ष्","o":"य","p":"उ","[":"ृ","]":"े","\\":"्","A":"ब्","S":"क्","D":"म्","F":"ँ","G":"न्","H":"ज्","J":"व्","K":"प्","L":"ी",":":"स्","\"":"ू","a":"ब","s":"क","d":"म","f":"ा","g":"न","h":"ज","j":"व","k":"प","l":"ि",";":"स","'":"ु","Z":"श्","X":"ह्","C":"ऋ","V":"ख्","B":"द्य","N":"ल्","M":"ः","<":"?",">":"श्र","?":"रु","z":"श","x":"ह","c":"अ","v":"ख","b":"द","n":"ल",",":",",".":"।","/":"र","„":"ध्र","…":"‘","ˆ":"फ्","‰":"झ्","‹":"ङ्घ","‘":"ॅ","•":"ड्ड","˜":"ऽ","›":"द्र","¡":"ज्ञ्","¢":"द्घ","£":"घ्","¤":"झ्","¥":"्र","§":"ट्ट","©":"र","ª":"ङ","«":"्र","°":"ङ्ढ","±":"+","´":"झ","¶":"ठ्ठ","¿":"रू","Å":"हृ","Æ":"”","Ë":"ङ्ग","Ì":"न्न","Í":"ङ्क","Î":"ङ्ख","Ò":"¨","Ö":"=","×":"×","Ø":"्य","Ù":";","Ú":"’","Û":"!","Ü":"%","Ý":"ट्ठ","ß":"द्म","å":"द्व","æ":"“","ç":"ॐ","÷":"/"},"pre-rules":[],"post-rules":[["्ा",""],["(त्र|त्त)([^उभप]+?)m","\\1m\\2"],["त्रm","क्र"],["त्तm","क्त"],["([^उभप]+?)m","m\\1"],["उm","ऊ"],["भm","झ"],["पm","फ"],["इ{","ई"],["ि((.्)*[^्])","\\1ि"],["(.[ािीुूृेैोौंःँ]*?){","{\\1"],["((.्)*){","{\\1"],["{","र्"],["([ाीुूृेैोौंःँ]+?)(्(.्)*[^्])","\\2\\1"],["्([ाीुूृेैोौंःँ]+?)((.्)*[^्])","्\\2\\1"],["([ंँ])([ािीुूृेैोौः]*)","\\2\\1"],["ँँ","ँ"],["ंं","ं"],["ेे","े"],["ैै","ै"],["ुु","ु"],["ूू","ू"],["^ः",":"],["टृ","ट्ट"],["ेा","ाे"],["ैा","ाै"],["अाे","ओ"],["अाै","औ"],["अा","आ"],["एे","ऐ"],["ाे","ो"],["ाै","ौ"]]}},"FONTASY_HIMALI_TT":{"version":"v0.01","rules":{"character-map":{"0":"०","1":"१","2":"२","3":"३","4":"४","5":"५","6":"६","7":"७","8":"८","9":"९","~":"ञ","!":"ज्ञ","@":"द्द","#":"घ","$":"द्ध","%":"छ","^":"ट","&":"ठ","*":"ड","(":"ढ",")":"ण्","_":")","+":"ं","`":"ञ्","-":"(","=":".","Q":"त्त","W":"ध्","E":"भ्","R":"च्","T":"त्","Y":"थ्","U":"ग्","I":"क्ष्","O":"इ","P":"ए","}":"ै","|":"्र","q":"त्र","w":"ध","e":"भ","r":"च","t":"त","y":"थ","u":"ग","i":"ष्","o":"य","p":"उ","[":"ृ","]":"े","\\":"्","A":"ब्","S":"क्","D":"म्","F":"ा","G":"न्","H":"ज्","J":"व्","K":"प्","L":"ी",":":"स्","\"":"ू","a":"ब","s":"क","d":"म","f":"ा","g":"न","h":"ज","j":"व","k":"प","l":"ि",";":"स","'":"ु","Z":"श्","X":"हृ","C":"ऋ","V":"ख्","B":"द्य","N":"ल्","M":"ः","<":"?",">":"श्र","?":"रु","z":"श","x":"ह","c":"अ","v":"ख","b":"द","n":"ल",",":",",".":"।","/":"र","¡":"ज्ञ्","¢":"द्घ","£":"घ्","¤":"ँ","¥":"र्‍","§":"ट्ट","ª":"ङ","«":"्र","­":"(","®":"+","°":"ङ्क","´":"झ","¶":"ठ्ठ","»":"","¿":"रू","Æ":"”","Ñ":"ङ","Ò":"ू","Ô":"क्ष","×":"×","Ø":"्य","Ù":"ह","Ú":"ु","ß":"द्म","å":"द्व","æ":"“","ç":"ॐ","é":"ङ्ग","í":"ष","÷":"/","ø":"य्","ú":"ू"},"pre-rules":[],"post-rules":[["्ा",""],["(त्र|त्त)([^उभप]+?)m","\\1m\\2"],["त्रm","क्र"],["त्तm","क्त"],["([^उभप]+?)m","m\\1"],["उm","ऊ"],["भm","झ"],["पm","फ"],["इ{","ई"],["ि((.्)*[^्])","\\1ि"],["(.[ािीुूृेैोौंःँ]*?){","{\\1"],["((.्)*){","{\\1"],["{","र्"],["([ाीुूृेैोौंःँ]+?)(्(.्)*[^्])","\\2\\1"],["्([ाीुूृेैोौंःँ]+?)((.्)*[^्])","्\\2\\1"],["([ंँ])([ािीुूृेैोौः]*)","\\2\\1"],["ँँ","ँ"],["ंं","ं"],["ेे","े"],["ैै","ै"],["ुु","ु"],["ूू","ू"],["^ः",":"],["टृ","ट्ट"],["ेा","ाे"],["ैा","ाै"],["अाे","ओ"],["अाै","औ"],["अा","आ"],["एे","ऐ"],["ाे","ो"],["ाै","ौ"]]}},"Kantipur":{"version":"v0.01","rules":{"character-map":{"0":"ण्","1":"ज्ञ","2":"द्द","3":"घ","4":"द्ध","5":"छ","6":"ट","7":"ठ","8":"ड","9":"ढ","~":"ञ्","!":"१","@":"२","#":"३","$":"४","%":"५","^":"६","&":"७","*":"८","(":"९",")":"०","_":")","+":"ं","`":"ञ","-":"(","=":".","Q":"त्त","W":"ध्","E":"भ्","R":"च्","T":"त्","Y":"थ्","U":"ग्","I":"क्ष्","O":"इ","P":"ए","}":"ै","|":"्र","q":"त्र","w":"ध","e":"भ","r":"च","t":"त","y":"थ","u":"ग","i":"ष्","o":"य","p":"उ","[":"ृ","]":"े","\\":"्","A":"ब्","S":"क्","D":"म्","F":"ा","G":"न्","H":"ज्","J":"व्","K":"प्","L":"ी",":":"स्","\"":"ू","a":"ब","s":"क","d":"म","f":"ा","g":"न","h":"ज","j":"व","k":"प","l":"ि",";":"स","'":"ु","Z":"श्","X":"हृ","C":"ऋ","V":"ख्","B":"द्य","N":"ल्","M":"ः","<":"?",">":"श्र","?":"रु","z":"श","x":"ह","c":"अ","v":"ख","b":"द","n":"ल",",":",",".":"।","/":"र","„":"ध्र","…":"‘","†":"!","‰":"झ्","‹":"ङ्ग","Œ":"त्त्","‘":"ॅ","“":"ँ","•":"ड्ड","˜":"ऽ","™":"र","›":"ऽ","œ":"त्र्","¡":"ज्ञ्","¢":"द्घ","£":"घ्","¤":"झ्","¥":"र्‍","§":"ट्ट","¨":"ङ्ग","©":"र","ª":"ङ","«":"्र","¬":"…","­":"(","®":"र","¯":"¯","°":"ङ्ढ","±":"+","´":"झ","µ":"र","¶":"ठ्ठ","º":"फ्","¿":"रू","Â":"र","Æ":"”","È":"ष","Ë":"ङ्ग","Ì":"न्न","Í":"ङ्क","Î":"फ्","Ï":"फ्","Ò":"¨","Ô":"क्ष","Ø":"्य","Ú":"’","ß":"द्म","å":"द्व","æ":"“","ç":"ॐ","÷":"/","ø":"य्"},"pre-rules":[],"post-rules":[["्ा",""],["(त्र|त्त)([^उभप]+?)m","\\1m\\2"],["त्रm","क्र"],["त्तm","क्त"],["([^उभप]+?)m","m\\1"],["उm","ऊ"],["भm","झ"],["पm","फ"],["इ{","ई"],["ि((.्)*[^्])","\\1ि"],["(.[ािीुूृेैोौंःँ]*?){","{\\1"],["((.्)*){","{\\1"],["{","र्"],["([ाीुूृेैोौंःँ]+?)(्(.्)*[^्])","\\2\\1"],["्([ाीुूृेैोौंःँ]+?)((.्)*[^्])","्\\2\\1"],["([ंँ])([ािीुूृेैोौः]*)","\\2\\1"],["ँँ","ँ"],["ंं","ं"],["ेे","े"],["ैै","ै"],["ुु","ु"],["ूू","ू"],["^ः",":"],["टृ","ट्ट"],["ेा","ाे"],["ैा","ाै"],["अाे","ओ"],["अाै","औ"],["अा","आ"],["एे","ऐ"],["ाे","ो"],["ाै","ौ"]]}},"PCS NEPALI":{"version":"v0.1a","rules":{"character-map":{"0":"०","1":"१","2":"२","3":"३","4":"४","5":"५","6":"६","7":"७","8":"८","9":"९","~":"ङ","!":"ज्ञ","@":"द्द","#":"घ","$":"द्ध","%":"छ","^":"ट","&":"ठ","*":"ड","(":"ढ",")":"ण्","_":")","+":"ं","`":"ञ्","-":"(","=":".","Q":"त्त","W":"ध्","E":"भ्","R":"च्","T":"त्","Y":"थ्","U":"ग्","I":"क्ष्","O":"इ","P":"ए","}":"ै","|":"्र","q":"त्र","w":"ध","e":"भ","r":"च","t":"त","y":"थ","u":"ग","i":"ष्","o":"य","p":"उ","[":"ृ","]":"े","\\":"्","A":"ब्","S":"क्","D":"म्","F":"ा","G":"न्","H":"ज्","J":"व्","K":"प्","L":"ी",":":"स्","\"":"ू","a":"ब","s":"क","d":"म","f":"ा","g":"न","h":"ज","j":"व","k":"प","l":"ि",";":"स","'":"ु","Z":"श्","X":"ह्","C":"र्‍","V":"ख्","B":"द्य","N":"ल्","M":"ः","<":"्र",">":"श्र","?":"रू","z":"श","x":"ह","c":"अ","v":"ख","b":"द","n":"ल",",":",",".":"।","/":"र","¡":"ज्ञ्","¢":"द्घ","£":"घ्","¤":"ँ","¥":"ऋ","§":"ट्ट","©":"?","ª":"ञ","®":"+","°":"ङ्क","´":"झ","·":"ट्ठ","¿":"रु","Æ":"”","Ò":"ू","Ô":"क्ष","Ø":"्य","Ù":"ह","ß":"द्म","å":"द्व","æ":"“","ç":"ॐ","é":"ङ्ग","í":"ष","ñ":"ङ","÷":"/","ø":"य्","ú":"ू"},"pre-rules":[],"post-rules":[["्ा",""],["(त्र|त्त)([^उभप]+?)m","\\1m\\2"],["त्रm","क्र"],["त्तm","क्त"],["([^उभप]+?)m","m\\1"],["उm","ऊ"],["भm","झ"],["पm","फ"],["इ{","ई"],["ि((.्)*[^्])","\\1ि"],["(.[ािीुूृेैोौंःँ]*?){","{\\1"],["((.्)*){","{\\1"],["{","र्"],["([ाीुूृेैोौंःँ]+?)(्(.्)*[^्])","\\2\\1"],["्([ाीुूृेैोौंःँ]+?)((.्)*[^्])","्\\2\\1"],["([ंँ])([ािीुूृेैोौः]*)","\\2\\1"],["ँँ","ँ"],["ंं","ं"],["ेे","े"],["ैै","ै"],["ुु","ु"],["ूू","ू"],["^ः",":"],["टृ","ट्ट"],["ेा","ाे"],["ैा","ाै"],["अाे","ओ"],["अाै","औ"],["अा","आ"],["एे","ऐ"],["ाे","ो"],["ाै","ौ"]]}},"Sagarmatha":{"version":"v0.1a","rules":{"character-map":{"0":"ण्","1":"ज्ञ","2":"द्द","3":"घ","4":"द्ध","5":"छ","6":"ट","7":"ठ","8":"ड","9":"ढ","~":"ञ्","!":"१","@":"२","#":"३","$":"४","%":"५","^":"६","&":"७","*":"८","(":"९",")":"०","_":")","+":"ं","`":"ञ","-":"(","=":".","Q":"त्त","W":"ध्","E":"भ्","R":"च्","T":"त्","Y":"थ्","U":"ग्","I":"क्ष्","O":"इ","P":"ए","}":"ै","|":"्र","q":"त्र","w":"ध","e":"भ","r":"च","t":"त","y":"थ","u":"ग","i":"ष्","o":"य","p":"उ","[":"ृ","]":"े","\\":"्","A":"ब्","S":"क्","D":"म्","F":"ँ","G":"न्","H":"ज्","J":"व्","K":"प्","L":"ी",":":"स्","\"":"ू","a":"ब","s":"क","d":"म","f":"ा","g":"न","h":"ज","j":"व","k":"प","l":"ि",";":"स","'":"ु","Z":"श्","X":"ह्","C":"ऋ","V":"ख्","B":"द्य","N":"ल्","M":"ः","<":"?",">":"श्र","?":"रु","z":"श","x":"ह","c":"अ","v":"ख","b":"द","n":"ल",",":",",".":"।","/":"र","‚":")","ƒ":"द्र","„":"्","†":";","‡":"े","ˆ":"ृ","‰":"झ्","Š":"र्","‹":"ै","Œ":"त्त्","‘":"‘","’":"’","“":"ँ","”":"”","œ":"त्र्","¡":"ज्ञ्","¢":"द्घ","£":"घ्","¤":"!","¥":"र्‍","§":"ट्ट","ª":"ङ","«":"्र","¬":"ु","­":"(","®":"र","°":"ङ्क","±":"+","´":"झ","µ":"झ","¶":"ठ्ठ","·":"ङ्ग","¸":"ड्ड","¿":"रू","Å":"फ","Æ":"”","Ç":"फ्","È":"ष","É":"स","Ò":"ू","Ô":"क्ष","Ø":"्य","Ù":"ह","Ü":"%","Þ":"ह्","ß":"द्म","å":"द्व","æ":"“","ç":"ॐ","è":"द्भ","÷":"/","ø":"य्"},"pre-rules":[],"post-rules":[["्ा",""],["(त्र|त्त)([^उभप]+?)m","\\1m\\2"],["त्रm","क्र"],["त्तm","क्त"],["([^उभप]+?)m","m\\1"],["उm","ऊ"],["भm","झ"],["पm","फ"],["इ{","ई"],["ि((.्)*[^्])","\\1ि"],["(.[ािीुूृेैोौंःँ]*?){","{\\1"],["((.्)*){","{\\1"],["{","र्"],["([ाीुूृेैोौंःँ]+?)(्(.्)*[^्])","\\2\\1"],["्([ाीुूृेैोौंःँ]+?)((.्)*[^्])","्\\2\\1"],["([ंँ])([ािीुूृेैोौः]*)","\\2\\1"],["ँँ","ँ"],["ंं","ं"],["ेे","े"],["ैै","ै"],["ुु","ु"],["ूू","ू"],["^ः",":"],["टृ","ट्ट"],["ेा","ाे"],["ैा","ाै"],["अाे","ओ"],["अाै","औ"],["अा","आ"],["एे","ऐ"],["ाे","ो"],["ाै","ौ"]]}}}
//var selection; // used to capture document.selection so that it can be converted from PREETI if necessary

//document.addEventListener('selectionchange', (e)=>{selection = window.getSelection().toString();});

function convertPreeti(nepali) {
    
    //const fs = require('fs');
    var all_rules = "";
    var supportedMaps = "";
/*
    function main() {
        // '/Users/connorlee/Documents/GitHub/loomaai/npttf2utf/files/map.json'
        all_rules = JSON.parse("{\"Preeti\":{\"version\":\"v0.01\",\"rules\":{\"character-map\":{\"0\":\"ण्\",\"1\":\"ज्ञ\",\"2\":\"द्द\",\"3\":\"घ\",\"4\":\"द्ध\",\"5\":\"छ\",\"6\":\"ट\",\"7\":\"ठ\",\"8\":\"ड\",\"9\":\"ढ\",\"~\":\"ञ्\",\"!\":\"१\",\"@\":\"२\",\"#\":\"३\",\"$\":\"४\",\"%\":\"५\",\"^\":\"६\",\"&\":\"७\",\"*\":\"८\",\"(\":\"९\",\")\":\"०\",\"_\":\")\",\"+\":\"ं\",\"\":\"\",\"`\":\"ञ\",\"-\":\"(\",\"=\":\".\",\"Q\":\"त्त\",\"W\":\"ध्\",\"E\":\"भ्\",\"R\":\"च्\",\"T\":\"त्\",\"Y\":\"थ्\",\"U\":\"ग्\",\"I\":\"क्ष्\",\"O\":\"इ\",\"P\":\"ए\",\"}\":\"ै\",\"|\":\"्र\",\"q\":\"त्र\",\"w\":\"ध\",\"e\":\"भ\",\"r\":\"च\",\"t\":\"त\",\"y\":\"थ\",\"u\":\"ग\",\"i\":\"ष्\",\"o\":\"य\",\"p\":\"उ\",\"[\":\"ृ\",\"]\":\"े\",\"\\\\\":\"्\",\"A\":\"ब्\",\"S\":\"क्\",\"D\":\"म्\",\"F\":\"ँ\",\"G\":\"न्\",\"H\":\"ज्\",\"J\":\"व्\",\"K\":\"प्\",\"L\":\"ी\",\":\":\"स्\",\"\\\"\":\"ू\",\"a\":\"ब\",\"s\":\"क\",\"d\":\"म\",\"f\":\"ा\",\"g\":\"न\",\"h\":\"ज\",\"j\":\"व\",\"k\":\"प\",\"l\":\"ि\",\";\":\"स\",\"'\":\"ु\",\"Z\":\"श्\",\"X\":\"ह्\",\"C\":\"ऋ\",\"V\":\"ख्\",\"B\":\"द्य\",\"N\":\"ल्\",\"M\":\"ः\",\"<\":\"?\",\">\":\"श्र\",\"?\":\"रु\",\"z\":\"श\",\"x\":\"ह\",\"c\":\"अ\",\"v\":\"ख\",\"b\":\"द\",\"n\":\"ल\",\",\":\",\",\".\":\"।\",\"/\":\"र\",\"„\":\"ध्र\",\"…\":\"‘\",\"ˆ\":\"फ्\",\"‰\":\"झ्\",\"‹\":\"ङ्घ\",\"‘\":\"ॅ\",\"•\":\"ड्ड\",\"˜\":\"ऽ\",\"›\":\"द्र\",\"¡\":\"ज्ञ्\",\"¢\":\"द्घ\",\"£\":\"घ्\",\"¤\":\"झ्\",\"¥\":\"्र\",\"§\":\"ट्ट\",\"©\":\"र\",\"ª\":\"ङ\",\"«\":\"्र\",\"°\":\"ङ्ढ\",\"±\":\"+\",\"´\":\"झ\",\"¶\":\"ठ्ठ\",\"¿\":\"रू\",\"Å\":\"हृ\",\"Æ\":\"”\",\"Ë\":\"ङ्ग\",\"Ì\":\"न्न\",\"Í\":\"ङ्क\",\"Î\":\"ङ्ख\",\"Ò\":\"¨\",\"Ö\":\"=\",\"×\":\"×\",\"Ø\":\"्य\",\"Ù\":\";\",\"Ú\":\"’\",\"Û\":\"!\",\"Ü\":\"%\",\"Ý\":\"ट्ठ\",\"ß\":\"द्म\",\"å\":\"द्व\",\"æ\":\"“\",\"ç\":\"ॐ\",\"÷\":\"/\"},\"pre-rules\":[],\"post-rules\":[[\"्ा\",\"\"],[\"(त्र|त्त)([^उभप]+?)m\",\"\\\\1m\\\\2\"],[\"त्रm\",\"क्र\"],[\"त्तm\",\"क्त\"],[\"([^उभप]+?)m\",\"m\\\\1\"],[\"उm\",\"ऊ\"],[\"भm\",\"झ\"],[\"पm\",\"फ\"],[\"इ{\",\"ई\"],[\"ि((.्)*[^्])\",\"\\\\1ि\"],[\"(.[ािीुूृेैोौंःँ]*?){\",\"{\\\\1\"],[\"((.्)*){\",\"{\\\\1\"],[\"{\",\"र्\"],[\"([ाीुूृेैोौंःँ]+?)(्(.्)*[^्])\",\"\\\\2\\\\1\"],[\"्([ाीुूृेैोौंःँ]+?)((.्)*[^्])\",\"्\\\\2\\\\1\"],[\"([ंँ])([ािीुूृेैोौः]*)\",\"\\\\2\\\\1\"],[\"ँँ\",\"ँ\"],[\"ंं\",\"ं\"],[\"ेे\",\"े\"],[\"ैै\",\"ै\"],[\"ुु\",\"ु\"],[\"ूू\",\"ू\"],[\"^ः\",\":\"],[\"टृ\",\"ट्ट\"],[\"ेा\",\"ाे\"],[\"ैा\",\"ाै\"],[\"अाे\",\"ओ\"],[\"अाै\",\"औ\"],[\"अा\",\"आ\"],[\"एे\",\"ऐ\"],[\"ाे\",\"ो\"],[\"ाै\",\"ौ\"]]}},\"FONTASY_HIMALI_TT\":{\"version\":\"v0.01\",\"rules\":{\"character-map\":{\"~\":\"ञ\",\"!\":\"ज्ञ\",\"@\":\"द्द\",\"#\":\"घ\",\"$\":\"द्ध\",\"%\":\"छ\",\"^\":\"ट\",\"&\":\"ठ\",\"*\":\"ड\",\"(\":\"ढ\",\")\":\"ण्\",\"_\":\")\",\"+\":\"ं\",\"`\":\"ञ्\",\"1\":\"१\",\"2\":\"२\",\"3\":\"३\",\"4\":\"४\",\"5\":\"५\",\"6\":\"६\",\"7\":\"७\",\"8\":\"८\",\"9\":\"९\",\"0\":\"०\",\"-\":\"(\",\"=\":\".\",\"Q\":\"त्त\",\"W\":\"ध्\",\"E\":\"भ्\",\"R\":\"च्\",\"T\":\"त्\",\"Y\":\"थ्\",\"U\":\"ग्\",\"I\":\"क्ष्\",\"O\":\"इ\",\"P\":\"ए\",\"}\":\"ै\",\"|\":\"्र\",\"q\":\"त्र\",\"w\":\"ध\",\"e\":\"भ\",\"r\":\"च\",\"t\":\"त\",\"y\":\"थ\",\"u\":\"ग\",\"i\":\"ष्\",\"o\":\"य\",\"p\":\"उ\",\"[\":\"ृ\",\"]\":\"े\",\"\\\\\":\"्\",\"A\":\"ब्\",\"S\":\"क्\",\"D\":\"म्\",\"F\":\"ा\",\"G\":\"न्\",\"H\":\"ज्\",\"J\":\"व्\",\"K\":\"प्\",\"L\":\"ी\",\":\":\"स्\",\"\\\"\":\"ू\",\"a\":\"ब\",\"s\":\"क\",\"d\":\"म\",\"f\":\"ा\",\"g\":\"न\",\"h\":\"ज\",\"j\":\"व\",\"k\":\"प\",\"l\":\"ि\",\";\":\"स\",\"'\":\"ु\",\"Z\":\"श्\",\"X\":\"हृ\",\"C\":\"ऋ\",\"V\":\"ख्\",\"B\":\"द्य\",\"N\":\"ल्\",\"M\":\"ः\",\"<\":\"?\",\">\":\"श्र\",\"?\":\"रु\",\"z\":\"श\",\"x\":\"ह\",\"c\":\"अ\",\"v\":\"ख\",\"b\":\"द\",\"n\":\"ल\",\",\":\",\",\".\":\"।\",\"/\":\"र\",\"¡\":\"ज्ञ्\",\"¢\":\"द्घ\",\"£\":\"घ्\",\"¤\":\"ँ\",\"¥\":\"र्‍\",\"§\":\"ट्ट\",\"ª\":\"ङ\",\"«\":\"्र\",\"­\":\"(\",\"®\":\"+\",\"°\":\"ङ्क\",\"´\":\"झ\",\"¶\":\"ठ्ठ\",\"»\":\"\",\"¿\":\"रू\",\"Æ\":\"”\",\"Ñ\":\"ङ\",\"Ò\":\"ू\",\"Ô\":\"क्ष\",\"×\":\"×\",\"Ø\":\"्य\",\"Ù\":\"ह\",\"Ú\":\"ु\",\"ß\":\"द्म\",\"å\":\"द्व\",\"æ\":\"“\",\"ç\":\"ॐ\",\"é\":\"ङ्ग\",\"í\":\"ष\",\"÷\":\"/\",\"ø\":\"य्\",\"ú\":\"ू\"},\"pre-rules\":[],\"post-rules\":[[\"्ा\",\"\"],[\"(त्र|त्त)([^उभप]+?)m\",\"\\\\1m\\\\2\"],[\"त्रm\",\"क्र\"],[\"त्तm\",\"क्त\"],[\"([^उभप]+?)m\",\"m\\\\1\"],[\"उm\",\"ऊ\"],[\"भm\",\"झ\"],[\"पm\",\"फ\"],[\"इ{\",\"ई\"],[\"ि((.्)*[^्])\",\"\\\\1ि\"],[\"(.[ािीुूृेैोौंःँ]*?){\",\"{\\\\1\"],[\"((.्)*){\",\"{\\\\1\"],[\"{\",\"र्\"],[\"([ाीुूृेैोौंःँ]+?)(्(.्)*[^्])\",\"\\\\2\\\\1\"],[\"्([ाीुूृेैोौंःँ]+?)((.्)*[^्])\",\"्\\\\2\\\\1\"],[\"([ंँ])([ािीुूृेैोौः]*)\",\"\\\\2\\\\1\"],[\"ँँ\",\"ँ\"],[\"ंं\",\"ं\"],[\"ेे\",\"े\"],[\"ैै\",\"ै\"],[\"ुु\",\"ु\"],[\"ूू\",\"ू\"],[\"^ः\",\":\"],[\"टृ\",\"ट्ट\"],[\"ेा\",\"ाे\"],[\"ैा\",\"ाै\"],[\"अाे\",\"ओ\"],[\"अाै\",\"औ\"],[\"अा\",\"आ\"],[\"एे\",\"ऐ\"],[\"ाे\",\"ो\"],[\"ाै\",\"ौ\"]]}},\"Kantipur\":{\"version\":\"v0.01\",\"rules\":{\"character-map\":{\"~\":\"ञ्\",\"!\":\"१\",\"@\":\"२\",\"#\":\"३\",\"$\":\"४\",\"%\":\"५\",\"^\":\"६\",\"&\":\"७\",\"*\":\"८\",\"(\":\"९\",\")\":\"०\",\"_\":\")\",\"+\":\"ं\",\"`\":\"ञ\",\"1\":\"ज्ञ\",\"2\":\"द्द\",\"3\":\"घ\",\"4\":\"द्ध\",\"5\":\"छ\",\"6\":\"ट\",\"7\":\"ठ\",\"8\":\"ड\",\"9\":\"ढ\",\"0\":\"ण्\",\"-\":\"(\",\"=\":\".\",\"Q\":\"त्त\",\"W\":\"ध्\",\"E\":\"भ्\",\"R\":\"च्\",\"T\":\"त्\",\"Y\":\"थ्\",\"U\":\"ग्\",\"I\":\"क्ष्\",\"O\":\"इ\",\"P\":\"ए\",\"}\":\"ै\",\"|\":\"्र\",\"q\":\"त्र\",\"w\":\"ध\",\"e\":\"भ\",\"r\":\"च\",\"t\":\"त\",\"y\":\"थ\",\"u\":\"ग\",\"i\":\"ष्\",\"o\":\"य\",\"p\":\"उ\",\"[\":\"ृ\",\"]\":\"े\",\"\\\\\":\"्\",\"A\":\"ब्\",\"S\":\"क्\",\"D\":\"म्\",\"F\":\"ा\",\"G\":\"न्\",\"H\":\"ज्\",\"J\":\"व्\",\"K\":\"प्\",\"L\":\"ी\",\":\":\"स्\",\"\\\"\":\"ू\",\"a\":\"ब\",\"s\":\"क\",\"d\":\"म\",\"f\":\"ा\",\"g\":\"न\",\"h\":\"ज\",\"j\":\"व\",\"k\":\"प\",\"l\":\"ि\",\";\":\"स\",\"'\":\"ु\",\"Z\":\"श्\",\"X\":\"हृ\",\"C\":\"ऋ\",\"V\":\"ख्\",\"B\":\"द्य\",\"N\":\"ल्\",\"M\":\"ः\",\"<\":\"?\",\">\":\"श्र\",\"?\":\"रु\",\"z\":\"श\",\"x\":\"ह\",\"c\":\"अ\",\"v\":\"ख\",\"b\":\"द\",\"n\":\"ल\",\",\":\",\",\".\":\"।\",\"/\":\"र\",\"„\":\"ध्र\",\"…\":\"‘\",\"†\":\"!\",\"‰\":\"झ्\",\"‹\":\"ङ्ग\",\"Œ\":\"त्त्\",\"‘\":\"ॅ\",\"“\":\"ँ\",\"•\":\"ड्ड\",\"˜\":\"ऽ\",\"™\":\"र\",\"›\":\"ऽ\",\"œ\":\"त्र्\",\"¡\":\"ज्ञ्\",\"¢\":\"द्घ\",\"£\":\"घ्\",\"¤\":\"झ्\",\"¥\":\"र्‍\",\"§\":\"ट्ट\",\"¨\":\"ङ्ग\",\"©\":\"र\",\"ª\":\"ङ\",\"«\":\"्र\",\"¬\":\"…\",\"­\":\"(\",\"®\":\"र\",\"¯\":\"¯\",\"°\":\"ङ्ढ\",\"±\":\"+\",\"´\":\"झ\",\"µ\":\"र\",\"¶\":\"ठ्ठ\",\"º\":\"फ्\",\"¿\":\"रू\",\"Â\":\"र\",\"Æ\":\"”\",\"È\":\"ष\",\"Ë\":\"ङ्ग\",\"Ì\":\"न्न\",\"Í\":\"ङ्क\",\"Î\":\"फ्\",\"Ï\":\"फ्\",\"Ò\":\"¨\",\"Ô\":\"क्ष\",\"Ø\":\"्य\",\"Ú\":\"’\",\"ß\":\"द्म\",\"å\":\"द्व\",\"æ\":\"“\",\"ç\":\"ॐ\",\"÷\":\"/\",\"ø\":\"य्\"},\"pre-rules\":[],\"post-rules\":[[\"्ा\",\"\"],[\"(त्र|त्त)([^उभप]+?)m\",\"\\\\1m\\\\2\"],[\"त्रm\",\"क्र\"],[\"त्तm\",\"क्त\"],[\"([^उभप]+?)m\",\"m\\\\1\"],[\"उm\",\"ऊ\"],[\"भm\",\"झ\"],[\"पm\",\"फ\"],[\"इ{\",\"ई\"],[\"ि((.्)*[^्])\",\"\\\\1ि\"],[\"(.[ािीुूृेैोौंःँ]*?){\",\"{\\\\1\"],[\"((.्)*){\",\"{\\\\1\"],[\"{\",\"र्\"],[\"([ाीुूृेैोौंःँ]+?)(्(.्)*[^्])\",\"\\\\2\\\\1\"],[\"्([ाीुूृेैोौंःँ]+?)((.्)*[^्])\",\"्\\\\2\\\\1\"],[\"([ंँ])([ािीुूृेैोौः]*)\",\"\\\\2\\\\1\"],[\"ँँ\",\"ँ\"],[\"ंं\",\"ं\"],[\"ेे\",\"े\"],[\"ैै\",\"ै\"],[\"ुु\",\"ु\"],[\"ूू\",\"ू\"],[\"^ः\",\":\"],[\"टृ\",\"ट्ट\"],[\"ेा\",\"ाे\"],[\"ैा\",\"ाै\"],[\"अाे\",\"ओ\"],[\"अाै\",\"औ\"],[\"अा\",\"आ\"],[\"एे\",\"ऐ\"],[\"ाे\",\"ो\"],[\"ाै\",\"ौ\"]]}},\"PCSNEPALI\":{\"version\":\"v0.1a\",\"rules\":{\"character-map\":{\"~\":\"ङ\",\"!\":\"ज्ञ\",\"@\":\"द्द\",\"#\":\"घ\",\"$\":\"द्ध\",\"%\":\"छ\",\"^\":\"ट\",\"&\":\"ठ\",\"*\":\"ड\",\"(\":\"ढ\",\")\":\"ण्\",\"_\":\")\",\"+\":\"ं\",\"`\":\"ञ्\",\"1\":\"१\",\"2\":\"२\",\"3\":\"३\",\"4\":\"४\",\"5\":\"५\",\"6\":\"६\",\"7\":\"७\",\"8\":\"८\",\"9\":\"९\",\"0\":\"०\",\"-\":\"(\",\"=\":\".\",\"Q\":\"त्त\",\"W\":\"ध्\",\"E\":\"भ्\",\"R\":\"च्\",\"T\":\"त्\",\"Y\":\"थ्\",\"U\":\"ग्\",\"I\":\"क्ष्\",\"O\":\"इ\",\"P\":\"ए\",\"}\":\"ै\",\"|\":\"्र\",\"q\":\"त्र\",\"w\":\"ध\",\"e\":\"भ\",\"r\":\"च\",\"t\":\"त\",\"y\":\"थ\",\"u\":\"ग\",\"i\":\"ष्\",\"o\":\"य\",\"p\":\"उ\",\"[\":\"ृ\",\"]\":\"े\",\"\\\\\":\"्\",\"A\":\"ब्\",\"S\":\"क्\",\"D\":\"म्\",\"F\":\"ा\",\"G\":\"न्\",\"H\":\"ज्\",\"J\":\"व्\",\"K\":\"प्\",\"L\":\"ी\",\":\":\"स्\",\"\\\"\":\"ू\",\"a\":\"ब\",\"s\":\"क\",\"d\":\"म\",\"f\":\"ा\",\"g\":\"न\",\"h\":\"ज\",\"j\":\"व\",\"k\":\"प\",\"l\":\"ि\",\";\":\"स\",\"'\":\"ु\",\"Z\":\"श्\",\"X\":\"ह्\",\"C\":\"र्‍\",\"V\":\"ख्\",\"B\":\"द्य\",\"N\":\"ल्\",\"M\":\"ः\",\"<\":\"्र\",\">\":\"श्र\",\"?\":\"रू\",\"z\":\"श\",\"x\":\"ह\",\"c\":\"अ\",\"v\":\"ख\",\"b\":\"द\",\"n\":\"ल\",\",\":\",\",\".\":\"।\",\"/\":\"र\",\"¡\":\"ज्ञ्\",\"¢\":\"द्घ\",\"£\":\"घ्\",\"¤\":\"ँ\",\"¥\":\"ऋ\",\"§\":\"ट्ट\",\"©\":\"?\",\"ª\":\"ञ\",\"®\":\"+\",\"°\":\"ङ्क\",\"´\":\"झ\",\"·\":\"ट्ठ\",\"¿\":\"रु\",\"Æ\":\"”\",\"Ò\":\"ू\",\"Ô\":\"क्ष\",\"Ø\":\"्य\",\"Ù\":\"ह\",\"ß\":\"द्म\",\"å\":\"द्व\",\"æ\":\"“\",\"ç\":\"ॐ\",\"é\":\"ङ्ग\",\"í\":\"ष\",\"ñ\":\"ङ\",\"÷\":\"/\",\"ø\":\"य्\",\"ú\":\"ू\"},\"pre-rules\":[],\"post-rules\":[[\"्ा\",\"\"],[\"(त्र|त्त)([^उभप]+?)m\",\"\\\\1m\\\\2\"],[\"त्रm\",\"क्र\"],[\"त्तm\",\"क्त\"],[\"([^उभप]+?)m\",\"m\\\\1\"],[\"उm\",\"ऊ\"],[\"भm\",\"झ\"],[\"पm\",\"फ\"],[\"इ{\",\"ई\"],[\"ि((.्)*[^्])\",\"\\\\1ि\"],[\"(.[ािीुूृेैोौंःँ]*?){\",\"{\\\\1\"],[\"((.्)*){\",\"{\\\\1\"],[\"{\",\"र्\"],[\"([ाीुूृेैोौंःँ]+?)(्(.्)*[^्])\",\"\\\\2\\\\1\"],[\"्([ाीुूृेैोौंःँ]+?)((.्)*[^्])\",\"्\\\\2\\\\1\"],[\"([ंँ])([ािीुूृेैोौः]*)\",\"\\\\2\\\\1\"],[\"ँँ\",\"ँ\"],[\"ंं\",\"ं\"],[\"ेे\",\"े\"],[\"ैै\",\"ै\"],[\"ुु\",\"ु\"],[\"ूू\",\"ू\"],[\"^ः\",\":\"],[\"टृ\",\"ट्ट\"],[\"ेा\",\"ाे\"],[\"ैा\",\"ाै\"],[\"अाे\",\"ओ\"],[\"अाै\",\"औ\"],[\"अा\",\"आ\"],[\"एे\",\"ऐ\"],[\"ाे\",\"ो\"],[\"ाै\",\"ौ\"]]}},\"Sagarmatha\":{\"version\":\"v0.1a\",\"rules\":{\"character-map\":{\"~\":\"ञ्\",\"!\":\"१\",\"@\":\"२\",\"#\":\"३\",\"$\":\"४\",\"%\":\"५\",\"^\":\"६\",\"&\":\"७\",\"*\":\"८\",\"(\":\"९\",\")\":\"०\",\"_\":\")\",\"+\":\"ं\",\"`\":\"ञ\",\"1\":\"ज्ञ\",\"2\":\"द्द\",\"3\":\"घ\",\"4\":\"द्ध\",\"5\":\"छ\",\"6\":\"ट\",\"7\":\"ठ\",\"8\":\"ड\",\"9\":\"ढ\",\"0\":\"ण्\",\"-\":\"(\",\"=\":\".\",\"Q\":\"त्त\",\"W\":\"ध्\",\"E\":\"भ्\",\"R\":\"च्\",\"T\":\"त्\",\"Y\":\"थ्\",\"U\":\"ग्\",\"I\":\"क्ष्\",\"O\":\"इ\",\"P\":\"ए\",\"}\":\"ै\",\"|\":\"्र\",\"q\":\"त्र\",\"w\":\"ध\",\"e\":\"भ\",\"r\":\"च\",\"t\":\"त\",\"y\":\"थ\",\"u\":\"ग\",\"i\":\"ष्\",\"o\":\"य\",\"p\":\"उ\",\"[\":\"ृ\",\"]\":\"े\",\"\\\\\":\"्\",\"A\":\"ब्\",\"S\":\"क्\",\"D\":\"म्\",\"F\":\"ँ\",\"G\":\"न्\",\"H\":\"ज्\",\"J\":\"व्\",\"K\":\"प्\",\"L\":\"ी\",\":\":\"स्\",\"\\\"\":\"ू\",\"a\":\"ब\",\"s\":\"क\",\"d\":\"म\",\"f\":\"ा\",\"g\":\"न\",\"h\":\"ज\",\"j\":\"व\",\"k\":\"प\",\"l\":\"ि\",\";\":\"स\",\"'\":\"ु\",\"Z\":\"श्\",\"X\":\"ह्\",\"C\":\"ऋ\",\"V\":\"ख्\",\"B\":\"द्य\",\"N\":\"ल्\",\"M\":\"ः\",\"<\":\"?\",\">\":\"श्र\",\"?\":\"रु\",\"z\":\"श\",\"x\":\"ह\",\"c\":\"अ\",\"v\":\"ख\",\"b\":\"द\",\"n\":\"ल\",\",\":\",\",\".\":\"।\",\"/\":\"र\",\"‚\":\")\",\"ƒ\":\"द्र\",\"„\":\"्\",\"†\":\";\",\"‡\":\"े\",\"ˆ\":\"ृ\",\"‰\":\"झ्\",\"Š\":\"र्\",\"‹\":\"ै\",\"Œ\":\"त्त्\",\"‘\":\"‘\",\"’\":\"’\",\"“\":\"ँ\",\"”\":\"”\",\"œ\":\"त्र्\",\"¡\":\"ज्ञ्\",\"¢\":\"द्घ\",\"£\":\"घ्\",\"¤\":\"!\",\"¥\":\"र्‍\",\"§\":\"ट्ट\",\"ª\":\"ङ\",\"«\":\"्र\",\"¬\":\"ु\",\"­\":\"(\",\"®\":\"र\",\"°\":\"ङ्क\",\"±\":\"+\",\"´\":\"झ\",\"µ\":\"झ\",\"¶\":\"ठ्ठ\",\"·\":\"ङ्ग\",\"¸\":\"ड्ड\",\"¿\":\"रू\",\"Å\":\"फ\",\"Æ\":\"”\",\"Ç\":\"फ्\",\"È\":\"ष\",\"É\":\"स\",\"Ò\":\"ू\",\"Ô\":\"क्ष\",\"Ø\":\"्य\",\"Ù\":\"ह\",\"Ü\":\"%\",\"Þ\":\"ह्\",\"ß\":\"द्म\",\"å\":\"द्व\",\"æ\":\"“\",\"ç\":\"ॐ\",\"è\":\"द्भ\",\"÷\":\"/\",\"ø\":\"य्\"},\"pre-rules\":[],\"post-rules\":[[\"्ा\",\"\"],[\"(त्र|त्त)([^उभप]+?)m\",\"\\\\1m\\\\2\"],[\"त्रm\",\"क्र\"],[\"त्तm\",\"क्त\"],[\"([^उभप]+?)m\",\"m\\\\1\"],[\"उm\",\"ऊ\"],[\"भm\",\"झ\"],[\"पm\",\"फ\"],[\"इ{\",\"ई\"],[\"ि((.्)*[^्])\",\"\\\\1ि\"],[\"(.[ािीुूृेैोौंःँ]*?){\",\"{\\\\1\"],[\"((.्)*){\",\"{\\\\1\"],[\"{\",\"र्\"],[\"([ाीुूृेैोौंःँ]+?)(्(.्)*[^्])\",\"\\\\2\\\\1\"],[\"्([ाीुूृेैोौंःँ]+?)((.्)*[^्])\",\"्\\\\2\\\\1\"],[\"([ंँ])([ािीुूृेैोौः]*)\",\"\\\\2\\\\1\"],[\"ँँ\",\"ँ\"],[\"ंं\",\"ं\"],[\"ेे\",\"े\"],[\"ैै\",\"ै\"],[\"ुु\",\"ु\"],[\"ूू\",\"ू\"],[\"^ः\",\":\"],[\"टृ\",\"ट्ट\"],[\"ेा\",\"ाे\"],[\"ैा\",\"ाै\"],[\"अाे\",\"ओ\"],[\"अाै\",\"औ\"],[\"अा\",\"आ\"],[\"एे\",\"ऐ\"],[\"ाे\",\"ो\"],[\"ाै\",\"ौ\"]]}}}");
        
        supportedMaps = Object.keys(all_rules);
        supportedMaps.push("Unicode");
        //knownDevanagariUnicodeFonts = ["Kalimati", "Mangal", "Noto Sans Devanagari"];
    }
*/
    function map_to_unicode(string, from_font="Preeti") {
        if (string) {
            var rules = PreetiToUnicode.Preeti.rules;
            const split_pattern = /(\s+|\S+)/g;
            var mapped_string = '';
            
            for (const w of string.match(split_pattern)) {
                var word = String(w);
                
                for (const rule of rules['pre-rules']) {
                    word = word.replace(new RegExp(rule[0]), rule[1]);
                }
                
                var mapped_word = '';
                
                for (const c of word) {
                    mapped_word += rules['character-map'][c];
                }
                
                for (const rule of rules['post-rules']) {
                    word = word.replace(new RegExp(rule[0]), rule[1]);
                }
                
                mapped_string = mapped_string + mapped_word;
            }
            return mapped_string
        } else {
            return string;
        }
    }
    //main();
    const english = /^([a-zA-Z0-9!@#$%^*_|:/.])*$/g;
  /*
    if (nepali.match(english)) {
        console.log(nepali + ' has only english characters');
        return nepali;
    }
*/
    const unicode = String(map_to_unicode(nepali, "Preeti"));
    console.log("Unicode for " + nepali + " is " + unicode);
    return unicode;
};

function restoreFullscreenControl () {
    $('#fullscreen-control').off('click').on('click', function (e) {
        e.preventDefault();
        LOOMA.toggleFullscreen();
    }); //end fullscreen
}

function toolbar_button_activate (id) {
    $('button.toolbar-button').removeClass('active');
    $('button.toolbar-button#toolbar-' + id).addClass('active');
}

$(document).ready (function() {
    
    window.top.scrollTo(0,1); // trying to remove toolbar on safari iPhone DOESNT WORK?
   // window.screen.orientation.lock('landscape'); // trying to force landscape orientation on iPhone DOESNT WORK?
    
    
    
        if (screen.orientation.type === 'portrait-primary'
           //&& (window.innerHeight > window.innerWidth)
        )
            LOOMA.alert('Looma should be viewed in Landscape mode. Please rotate your phone', 10, true);
    
    screen.orientation.addEventListener("change", function(e) {
        if (screen.orientation.type === 'portrait-primary')
            LOOMA.alert('Looma is best viewed in landscape mode. Please rotate your phone', 10, true);
        else LOOMA.closePopup();
    });
    
    
    
    //NOTE: experimental code to change color scheme for all Looma pages
    // not visible to users
   var main_color = LOOMA.readStore('main-color','local');
   var toolbar_color = LOOMA.readStore('toolbar-color','local');
    //document.documentElement.style.setProperty('--looma-background', main_color);
    //document.documentElement.style.setProperty('--looma-toolbar', toolbar_color);
    
    // LOOMA fullscreen display
    // any page can include a button with ID 'fullscreen-control'
    // to allow the user to make the element with id="fullscreen" display in fullscreen
    // that page must include:        <?php include ('includes/js-includes.php'); ?>

    restoreFullscreenControl();

    //turn off any speech when user leaves the page
    if (speechSynthesis) {$(window).on("unload", function(){speechSynthesis.cancel();});}

    // for translation: on every page load, check localStore['language'] for language to be used
    // if stored value doesnt exist, create a stored value with language='english'
    // then use the value to set KEYWORDs and TOOLTIPs on the page to 'english' [default]
    // or 'native' [change class="english-keyword" to hidden and class="native-keyword" to visible]
    
    language = LOOMA.readStore('language', 'cookie');
    if (!language) {
        LOOMA.setStore('language', 'english', 'cookie');
        language = 'english';
    }

    LOOMA.translate(language);

    // when TRANSLATE button is clicked, change the language localStore setting
    // language localStore values are 'english' or 'native'
    // and re-translate KEYWORDS on the page
    $('#translate').click(function(){
            // toggle the language var ('english' <--> 'native')
            language = (LOOMA.readStore('language', 'cookie') == 'english' ? 'native' : 'english' );
            // reset the cookie to the new setting
            LOOMA.setStore('language', language, 'cookie');
            // change all the keywords on the page to the new setting
            LOOMA.translate(language);
    
    
        if ((typeof media !== 'undefined') && 'textTracks' in media) {
            var tracks = media.textTracks;
    
            if (tracks.length === 1) {
                tracks[0].mode = 'showing';
            } else if (tracks.length > 0) {     // needs to be extended to more than 2 tracks when we add another language
                if (language === 'native') {
                    tracks[0].mode = "hidden";
                    tracks[1].mode = "showing";
                } else {
                    tracks[1].mode = "hidden";
                    tracks[0].mode = "showing";
                }
            }
        }
  
        if ($('button.subject')) {
            if (language === 'native') {
                $('button.subject img.native').show();
                $('button.subject img.english').hide();
            }
            else                       {
                $('button.subject img.english').show();
                $('button.subject img.native').hide();
            }
        };
        
    }); // end anonymous function for translate.click


    //NOTE: might be better to change the CLASS of #padlock, and use #padlock.classname in CSS to change the image src
    if (LOOMA.loggedIn()) $('#padlock').attr('src','images/padlock-open.png');
    else                  $('#padlock').attr('src','images/padlock-closed.png');
    
/* replaced with class="tip show-yes"
    function showDn (displayName, location) { $('#dn').html( '<p>' + displayName + '</p>').appendTo(location).show(); };
    
    $('#main-container-horizontal').on('mouseenter', '.activity',
        function(e) { $(e.currentTarget).find('.display-name').show();}
    );
    
    $('#main-container-horizontal').on('mouseleave', '.activity',
        function(e) { $(e.currentTarget).find('.display-name').hide();}
    );
*/
    

    $('#padlock').hover(
        function() { if (LOOMA.loggedIn()) {$('#login-id').show(); } },
        function() {                        $('#login-id').hide();  }
        );

    $('#padlock').click(function(){
        if (!LOOMA.loggedIn())
            {window.location = "looma-login.php";}
        else
            {LOOMA.confirm('are you sure you want to log out?',
                    function(){window.location = "looma-logout.php";},
                    function(){},
                    true);
            }
        });
    
    //$('#dismiss').click(     function() { window.history.back();});  //override this in JS if needed
    
    $('.back-button').click( function() { if (parent.history.length > 0) parent.history.back(); else location.replace('looma-home.php')});
    
 /* this code needs work, but should prevent leaving LOOMA with looma's back button
    $('.back-button').click( function() {
        if (parent.history.length > 0 &&
            (document.referrer.includes('looma') || document.referrer.includes('localhost')))
            history.back();
        else location.replace('looma-home.php');
    });
   */
    
    $('.screensize').text('Window size = ' + Math.round(window.outerWidth) + ' x ' + Math.round(window.outerHeight));
    $('.bodysize').text('HTML body size = ' + Math.round($('body').outerWidth()) + ' x ' + Math.round($('body').outerHeight()));


    function updateClock() {
        var now = new Date(); // current date
        var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        var mins = now.getMinutes();
        mins = (mins < 10 ? '0' + mins : mins);
        var time = now.getHours() + ':' + mins;
        // a cleaner way than string concatenation
        var date = [now.getDate(),
                    months[now.getMonth()],
                    now.getFullYear()].join(' ');
        // set the content of the element to the formatted string
        $('#datetime').html( [date, time].join(' ') );

           // call this function again in 60*1000ms
        setTimeout(updateClock, 60000);
    } //end updateClock()

    var datetime = document.getElementById('datetime');

    if (datetime) updateClock(); // initial call

    //attach LOOMA.speak() to the '.speak' button
    //NOTE: this code is overwritten in looma-pdf.js because looma-pdf.php displays the PDF in an <iframe> so the current selection in in the iframe
    //NOTE: this code is overwritten in looma-html.js because looma-html.php displays the PDF in an <iframe> so the current selection in in the iframe
    //NOTE: this code is also overwritten in looma-dictionary.js so that the entered word can be spoken w/o selecting
    //NOTE: this code is also overwritten in looma-clock.js so that the current time can be spoken w/o selecting
    //NOTE: this code is also overwritten in looma-vocab-flashcard.js so that the current word or defin can be spoken w/o selecting
    //NOTE: this code is also overwritten in looma-sort-game.js so that the current word can be spoken w/o selecting
    //IMPORTANT NOT: be sure to call .OFF() to turn off this click handler before adding another
    //     e.g. use code like this:  $('button.speak').off('click').click(function(){....
    $('button.speak').click(function(){
        var toString = window.getSelection().toString();
        //var toString = selection;
    
        // speak the definition if a lookup popup is showing
        var $def = $('#definition');
        if ($def) toString += $def.text();
        
        console.log ('selected text to speak: ', toString);
        LOOMA.speak(toString);
    });

    //attach LOOMA.lookup() to the '.lookup' button
    //NOTE: this code is overwritten in looma-pdf.js because looma-pdf.php displays the PDF in an <iframe> so the current selection is in the iframe
    $('button.lookup').click(function(){
        var toString =  window.getSelection().toString();
        //var toString = selection;
        console.log ('selected text to lookup: "', toString, '"');
       // LOOMA.lookupWord(toString);
        LOOMA.popupDefinition(toString.split(' ')[0], 15, 'en');
    });
    
/*
    //attach LOOMA.download() to the '.download' button
    
    // NOTE: this didnt work, at least on localhost
    //       using "<a href=filename download=targetfilename>"
    //       see looma.js at line
    
    
    $('button.download').click(function(){
        // name and path need to be set by the JS of the page with download button
        var name = 'Big_Bee.png';
        var path = '../content/pictures/';
        console.log ('selected file to download: "', path + name, '"');
        LOOMA.download(name, path);
    });
 */
 
 /* ////////////////////////////////////////////////////////////////////////
    try this to remove browser toolbar on smart phones [doesnt work yet 2023 07 27]
    
    window.onresize = function() {
        document.body.height = window.innerHeight;
    }
    window.onresize(); // called to initially set the height.
*/

}); //end of document.ready anonymous function

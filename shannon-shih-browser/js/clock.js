//English constants
var engDayOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var engMonths = ["January","February","March","April","May","June","July","August","September","October","November","December"];
var engSuffix = ["AM", "PM"];

//Alternate Language translation of constants (dubbed 'native')
var nativeDayOfWeek = ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहिबार", "शुक्रबार", "शनिबार"];	
var nativeMonths = ["जनवरी","फेब्रुअरी","मार्च","अप्रिल","सक्छ","जुन","जुलाई","अगस्ट","सेप्टेम्बर","अक्टोबर","नोभेम्बर","डिसेम्बर"];
var nativeNumbers = ["०","१","२","३","४","५","६","७","८","९"];
// Not sure about Nepali AM/PM translation
var nativeSuffix = ["बिहान", "साँझ"];

//variables that point to constant array of current language
var daysOfWeek;
var monthNames;
var curSuffix;

var dayOfWeek;
var month;
var day;
var year;
var hour;
var minute;

var currentLang;

// This function assigns appropriate constants to variables (day of week, month name, and AM/PM) depending on current language
function changeClockLang()
{
	if(localStorage.currentLang == 'English')
	{
		daysOfWeek = engDayOfWeek;
		monthNames = engMonths;
		curSuffix = engSuffix;
	}
	else
	{
		daysOfWeek = nativeDayOfWeek;
		monthNames = nativeMonths;
		curSuffix = nativeSuffix;
	}
	currentLang = localStorage.currentLang;
	updateDate();
}

// if native doesn't use arabic numbers, this function translates the numbers in the date to the corresponding number in native's numeric system.
function translateNums(num)
{
	var result = "";
	num = num.toString();
	for(i = 0; i < num.length; i++)
	{
		result = result + nativeNumbers[parseInt(num.charAt(i))];
	}
	return result;
}

// This function gets the current date
// @param is12HrTime: enter true if the clock is supposed to be in 12-hour time. 
function updateDate(is12HrTime)
{
	today = new Date();
	dayOfWeek = daysOfWeek[today.getDay()];
	month = monthNames[today.getMonth()];
	day = today.getDate();
	year = today.getFullYear();
	hour=today.getHours();
	
	suffix = curSuffix[0];
	if (hour > 12) {
		suffix = curSuffix[1];
		hour = hour % 12;
	}
	else if (hour == 12) {
		suffix = curSuffix[1];
	}

	if(currentLang != 'English')
	{
		day = translateNums(day);
		year = translateNums(year);
		hour = translateNums(hour);
	}
}

function checkTime(i) {
	if (i<10) {i = "0" + i};  // add zero in front of numbers < 10
	if(currentLang != 'English')
		i = translateNums(i);
	return i;
}

// this functions starts the clock and updates it every 500 ms
function startClock() {
	changeClockLang();
	updateDate();

	minute=today.getMinutes();
	minute = checkTime(minute);

	/* change date format here */
	document.getElementById('date-time').innerHTML = dayOfWeek + ", " + day + " " + month + ", " + year + " " + hour+ ":" + minute + " " + suffix;
	var t = setTimeout(function(){startClock()},500);
}
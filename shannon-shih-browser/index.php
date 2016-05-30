<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta http-equiv="Cache-control" content="no-cache">
<title>Homepage</title>
	<link rel='stylesheet' type='text/css' href='css/homepage-stylesheet.css'/>
</head>
<body background="images/looma website background.png" onload="loadLang();">
	
	<span id="themes">
					
				<button class="theme" id="looma" onclick="changebackground('looma')" title="Looma Classic"></button>	
				<button class="theme" id="hotpink" onclick="changebackground('hotpink')" title="Hot Pink"></button>	
				<button class="theme" id="blackandwhite" onclick="changebackground('blackandwhite')" title="Black & White"></button>
				<button class="theme" id="green" onclick="changebackground('green')" title="Eco Green"></button>
				<button class="theme" id="yellow" onclick="changebackground('yellow')" title="New Button"></button>

		</span>
    
	<div id="invisible-header"><img draggable="false" src="images/LoomaLogo.png"></div>
	<!-- class buttons (ex: class 1, class 2, etc.) -->
	<!-- The text class allow the text to be translated, and the color classes 
			determine what color the buttons will be -->
    <div id="classes">
		<a data-color="red" class="button text" onclick="setVisibility(this)"></a>
		<a data-color="orange" class="button text" onclick="setVisibility(this)"></a>
		<a data-color="yellow" class="button text" onclick="setVisibility(this)"></a>
		<a data-color="green" class="button text" onclick="setVisibility(this)"></a>
		<a data-color="blue" class="button text" onclick="setVisibility(this)"></a>
		<a data-color="dark-blue" class="button text" onclick="setVisibility(this)"></a>
		<a data-color="light-purple" class="button text" onclick="setVisibility(this)"></a>
		<a data-color="purple" class="button text" onclick="setVisibility(this)"></a>
	</div>
	
	<!-- subject buttons -->
	<div id="subjects" value="hidden">
		<a class="button text"></a>
	</div>

	<script type="text/javascript" src="js/translation.js"></script>
	<script type="text/javascript" src="js/useful-functions.js"></script>
	<script>
		/*
		* This function hides class buttons such that only numClasses number
		* of buttons are displayed and the displayed buttons are 
		* spaced evenly across the list
		*/
		var numClasses = 8;
		var buttons = document.getElementById("classes").getElementsByClassName('button');
		if(numClasses > buttons.length) {
			console.log("You have exceeded the maximum number of classes." + 
				"Please add css styling for more buttons and add them to the HTML.");
		}

		// hide all buttons so that only the ones needed will be shown
		for(var i = 0; i < buttons.length; i++) {
			buttons[i].style.display = "none";
		}

		// displays buttons evenly over the list of buttons
		for (var i = 0; i < buttons.length; i++) {
			var interval = buttons.length / numClasses;
			var button = buttons[Math.round(interval * i)];
			button.style.display = "inline";
			// button.innerHTML = classList[i];
			button.innerHTML = "Class " + (i + 1).toString();
			button.name = i + 1;
		}
	</script>

	<script>
		/*
		* Toggles the subject buttons, changes their color, and links them to 
		* the appropriate class and subject. Also makes the clicked button 
		* glow to more clearly indicate which class is being selected
		*/

		//stores the last object that was clicked and its class attribute 
		var lastObj;
		var lastObjClasses;

		var subjects = document.getElementById('subjects');	
		// origSubject is the original "template" subject button
		// that contains all the attributes needed for every subject button
		var origSubject = subjects.children[0];	
		subjects.removeChild(origSubject);

		/*
		* @param obj: the class button that was clicked
		*/
		function setVisibility(obj)  {					
			//list of subjects (to be replaced with MongoDB)
			// var allSubjects = {
			// 	class1: ['Nepali', 'English', 'Math', 'Science', 'History'],
			// 	class2: ['Nepali', 'English', 'Math', 'Social Studies', 'Science'],
			// 	class3: ['hello', 'class', 'three'], 
			// 	class4: ['class', 'four'],
			// 	class5: ['standing', 'up', 'is', 'nice'],
			// 	class6: ['random', 'wprds'],
			// 	class7: ['can\'t', 'think'],
			// 	class8: ['liberation']};

			<?php
				/*
				* displays the subjects for each class based on the database
				*/

				include('includes/mongo-connect.php');
				//get distinct number of classes in textbook db. Replace with db function
				$subjectArray;
				$numClasses = array("class1",	"class2",	"class3",	"class4",	"class5",	"class6",	"class7",	"class8"); 
				foreach($numClasses as $class) {
					// echo "class: $class\n";
					$subjectQuery = array('class' => array('$regex' => new MongoRegex("/^$class/i")));
					$subjects = $textbooks_collection -> find($subjectQuery);
					$subjects = iterator_to_array($subjects);
					$array = array();
					foreach($subjects as $s) {
						$array[] = ucwords(array_key_exists("filename", $s) ? $s["subject"] : null);
					}
					$subjectArray[$class] = array_values(array_filter($array));
				}
				$allSubjects = json_encode($subjectArray);
				echo "var allSubjects = $allSubjects;\n";
			?>

			// if clicked button is same as previously clicked button, 
			// then make that button stop glowing. 
			if(lastObj) {
				lastObj.className = lastObjClasses;
			}
			// saves clicked button's classes prior to glowing so
			// button can stop glowing when it is clicked again
			lastObjClasses = obj.className;

			//hides the subjects div when same class button is clicked again
			if(subjects.value === 'visible' && obj === lastObj) {				
				subjects.value = 'hidden';
				subjects.style.display = 'none';
				lastObj = obj;
			}
			else	//shows the subject buttons 
			{
				//makes button that was clicked start glowing
				obj.className = obj.className + " glow";

				// removes the previous class' buttons
				while(subjects.firstChild) {
					subjects.removeChild(subjects.firstChild);
				}

				subjectList = allSubjects["class" + obj.name];
				//creates the new class' subject buttons			
				for(var j = 0; j < subjectList.length; j++) {
					var newSubject = origSubject.cloneNode(true);
					newSubject.innerHTML = subjectList[j];
					subjects.appendChild(newSubject);
				}

				//displays the subject buttons
				subjects.value = 'visible';
				subjects.style.display = 'inline';
				
				// selects all the subject buttons
				var div = subjects.children;

				// iterates through all the elements in subjects and changes their
				// colors to match the clicked button's color
				for (var i = 0; i < div.length; i++) {
					div[i].setAttribute('data-color', 
						obj.getAttribute('data-color'));

						//sends class number, subject, and color to chapter-page.html
						div[i].href = "lesson-page.html?class=" + obj.name 
						+ "&subject=" + div[i].innerHTML 
						+ "&color=" + obj.getAttribute('data-color') + 
						"&chapter=1";
				}
				lastObj = obj;
			}
		}
	</script>

	<script>
		var lastcolor = null;
		function changebackground(color) {		   
			var body = document.getElementsByTagName('body')[0];
			if (color === lastcolor) {
				body.background = "images/looma website background.png";
				body.style.backgroundSize = "auto";
				lastcolor = null;
			}
			else if (color === "green") {
				body.background = "images/balloons.jpg";
				lastcolor = "green";
			}
				
			else  if (color === "looma") {			   
				body.background = "images/forest.png";
				lastcolor = "looma";
			}
			else if (color === "hotpink") {
				body.background = "images/beach.png";
				lastcolor = "hotpink";
			}
			else if (color === "blackandwhite") {
				body.background = "images/vines.png";
				lastcolor = "blackandwhite";
			}
			else  if (color === "yellow")  {
				body.background = "images/lake1.jpg";
				lastcolor = "yellow";
			}
			body.style.backgroundSize = "cover";
		}
	</script>

	<p><img draggable="false" src="images/loomy1.png" class= "loomy" height="100px" width = "200px"></p>

	<iframe id="footer" src="footer.html" seamless></iframe>
</body>
</html>
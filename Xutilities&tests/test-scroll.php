<!doctype html style="height:100%;">
<!--
Author:
Email: skip@stritter.com
Filename: yyy.html
Date: x/x/2015
Description: 
-->

<head>

</head>

<body style="height:100%;">
	<div style="position:relative; min-height:25%;border:4px solid green;">
		<div  id="test" style="position:absolute;background-color:#ccc;height:90%;width:90%;padding:10px;border:2px solid red;overflow:auto">
		<br>a<br>b<br>c<br>d<br>e<br>f<br>g<br>h<br>i<br>j<br>k<br>l<br>m<br>n<br>o<br>p<br>q<br>r<br>s<br>t<br>u<br>v<br>x<br>y<br>z<br>1<br>2<br>3<br>
		</div>
	</div>
<div>bottom stuff here</div>
	<!--Include other JS here -->
</body>
   	 <script src="js/jquery.js"></script>   <!-- jQuery -->
<script>
	function adjustScroll(){
		alert('stopped at ', $('#test').scroll());
		console.log('stopped scrolling at ', $('#test').scroll())
	};

	$(document).ready( function() 
	{	$('#test').on("scrollstart",adjustScroll);
		$(window).scroll(function () {console.log('scroll', window.pageYOffset);});
	});

</script>

</html>	

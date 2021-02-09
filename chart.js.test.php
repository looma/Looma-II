<!doctype html>
<!--
Filename: yyy.html
Date: 6/2015
Description: looma PHP template

Author: Skip
Owner:  VillageTech Solutions (villagetechsolutions.org)
Date:   2018
Revision: Looma 3
-->

<?php $page_title = 'Looma chart.js Test';
require_once ('includes/header.php');
define ("CLASSES", 8);
?>

<link rel="stylesheet" href="css/looma-template.css">

</head>


<!--
// Any of the following formats may be used
//var ctx = document.getElementById('myChart');
//var ctx = document.getElementById('myChart').getContext('2d');
//var ctx = $('#myChart');
//var ctx = 'myChart';
-->


<body>
<div id="main-container-horizontal">
    <div id="fullscreen">
        <canvas id="myChart" width="400" height="400"></canvas>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>


<script src="js/chart.bundle.min.js"></script>

<script>
    var ctx = document.getElementById('myChart');
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
            datasets: [{
                label: '# of Votes',
                data: [12, 19, 3, 5, 2, 3],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
</script>


</body>
</html>

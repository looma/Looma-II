/*
Filename: looma-log-viewer.js
Programmer name: Skip
Owner: Looma Education Company
Date: SEp 2021
Revision: Looma 3.0
 */

'use strict';
/* cURL used by Plausible: db-ip.com
curl https://db-ip.com/17.253.144.10 | grep latitude

{
"ipAddress": "17.253.144.10",
"continentCode": "NA",
"continentName": "North America",
"countryCode": "US",
"countryName": "United States",
"isEuMember": false,
"currencyCode": "USD",
"currencyName": "Dollar",
"phonePrefix": "1",
"languages": [
"en-US",
"es-US",
"haw",
"fr"],
"stateProvCode": "CA",
"stateProv": "California",
"district": "Santa Clara",
"city": "Cupertino",
"geonameId": 5341145,
"zipCode": "95014",
"latitude": 37.3219,
"longitude": -122.03,
"gmtOffset": -7,
"timeZone": "America/Los_Angeles",
"weatherCode": "USCA0273",
"asNumber": 714,
"asName": "APPLE-ENGINEERING",
"isp": "Apple Inc.",
"usageType": "hosting"
"organization": "Apple Inc",
"isCrawler": false,
"isProxy": false,
"threatLevel": "low"
}
 */
var randomScalingFactor = function() {
    return (Math.random() > 0.5 ? 1.0 : -1.0) * Math.round(Math.random() * 100);
}

$(document).ready( function () {

var chartColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(231,233,237)'
};

var data;

data = {
    labels: [],
    datasets: [{
        label: "Looma user activity",
        backgroundColor: chartColors.red,
        borderColor: chartColors.red,
        data: [],
        fill: false,
    },
        {
            label: "Unique visitors",
            backgroundColor: chartColors.blue,
            borderColor: chartColors.blue,
            data: [],
            fill: false,
        }
    ]
}

var config = {
    type: 'line',
    data: data,
    options: {
        responsive: true,
        title: {
            display: true,
            text: 'CEHRD Portal Hourly Activity'
        },
        tooltips: {mode: 'label',},
        hover: {
            mode: 'nearest',
            intersect: true
        },
        scales: {
            xAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Hour'
                }
            }],
            yAxes: [{
                display: true,
                ticks: {
                    beginAtZero:true,
                    stepSize:1
                },
                scaleLabel: {
                    display: true,
                    labelString: 'Unique Users'
                }
            }]
        }
    }
};

    var ctx = document.getElementById('chart').getContext('2d');

    function labelFormat(time, timeframe) {
        var formattedTime;
        switch (timeframe) {
            case 'hours': formattedTime = time.substr(-2,2) + ':00'; break;
            case 'days':formattedTime = time.substr(-2,2); break;
            case 'weeks':formattedTime = 'week '+ time.substr(-2,2); break;
            case 'months':formattedTime = time.substr(-2,2); break;
        }
        return formattedTime;
    }
    
    $.post("looma-database-utilities.php",
       // {cmd: "getLogData", timeframe:"hours", chunk: 24, prev: 0},
        {cmd: "getLogData", timeframe:"hours", chunk: 24, prev: 0},
                   function(results) {
                       //returns an array of 'count' visit-count values
                     
                     data.data = [];
                     for (var i=0; i < results.length; i++) {
                         data.datasets[0].data[i] = results[i]['visits'];
                         data.datasets[1].data[i] = results[i]['uniques'];
                         data.labels[i] = labelFormat(results[i]['time'],'hours');
                     }
                     var myChart = new Chart(ctx, config);
                   },
                   'json'
               );
});
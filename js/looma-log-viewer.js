/*
Filename: looma-log-viewer.js
Programmer name: Skip
Owner: Looma Education Company
Date: SEp 2021
Revision: Looma 3.0
 */

'use strict';

var  months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December","January"];
var chunksize = {'hours':24, 'days':30, 'weeks':14, 'months': 12 };

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

var chartColors = {
    red:    'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green:  'rgb(75, 192, 192)',
    blue:   'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey:   'rgb(231,233,237)'
};

var linedata, lineconfig, linechart, linectx;
var bardata,  barconfig,  barchart,  barctx;
var axisNames = {'hours':'Hour', 'days':'Day', 'weeks':'Week', 'months':'Month'};

// NOTE: js/chartjs/chart.min.js is Chart.js v3 - options below use v3 syntax
//       (scales.x / scales.y, plugins.legend, plugins.title, interaction)
//       responsive + maintainAspectRatio:false makes each chart fill its .chart-box
Chart.defaults.font.size = (window.innerWidth < 600) ? 10 : 13;

linedata = {
    labels: [],
    datasets: [{
        label: 'Looma user activity',
        backgroundColor: chartColors.red,
        borderColor: chartColors.red,
        data: [],
        fill: false,
        tension: 0.2
    },
        {
            label: 'Unique visitors',
            backgroundColor: chartColors.blue,
            borderColor: chartColors.blue,
            data: [],
            fill: false,
            tension: 0.2
        }
    ]
};

lineconfig = {
    type: 'line',
    data: linedata,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {mode: 'index', intersect: false},
        plugins: {
            legend: {position: 'top'},
            title:  {display: false}
        },
        scales: {
            x: {
                title: {display: true, text: 'Day'},
                ticks: {autoSkip: true, maxRotation: 0}
            },
            y: {
                beginAtZero: true,
                ticks: {precision: 0},
                title: {display: true, text: 'Visits'}
            }
        }
    }
};

bardata = {
    labels: [],
    datasets: [
        {
            label: '',
            data: [],
            backgroundColor: ['red','orange','gold','green','blue','violet','magenta']
        }
    ]
};

barconfig = {
    type: 'bar',
    data: bardata,
    options: {
        indexAxis: 'y',             // horizontal bars: long page names stay readable on narrow screens
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {display: false},
            title:  {display: false}
        },
        scales: {
            x: {beginAtZero: true, ticks: {precision: 0}, title: {display: true, text: 'Hits'}},
            y: {ticks: {autoSkip: false}}
        }
    }
};

function labelFormat(utc, dbTime, timeframe) {
    var formattedTime;
    var time = new Date(utc*1000);
    switch (timeframe) {
        case 'hours': formattedTime = time.getHours() + ':00'; break;
        case 'days':  formattedTime = time.getDate();         break;
        case 'weeks': formattedTime = dbTime.substring(dbTime.length - 2);break;
        case 'months':formattedTime = months[time.getMonth()+1]; break;
    }

    return formattedTime;
};  // end labelFormat()

function drawLineChart(timeframe, prev) {
    $('#barbox, #barcontrols').hide(); $('#linebox, #linecontrols').show();

    $.post('looma-database-utilities.php',
        {cmd: 'getLogData', type:timeframe, chunk: chunksize[timeframe], prev: prev},
        function(results) {
            //returns an array of 'chunk' or fewer visit-count values in results.data
            //returns 'first' T/F and 'last' T/F to indicate if we are at the beginning or end of the available data

            $('#prev').prop('disabled', results.first);
            $('#next').prop('disabled', results.last);

            linedata.datasets[0].data = [];
            linedata.datasets[1].data = [];
            linedata.labels = [];

            for (var i=0; i < results.data.length; i++) {
                linedata.datasets[0].data[i] = results.data[i]['visits'];
                linedata.datasets[1].data[i] = results.data[i]['uniques'];
                linedata.labels[i] = labelFormat(results.data[i]['utc'],results.data[i]['time'],timeframe);
            }

            var title = 'Activity';
            if (results.data.length > 0) {
                var titleDate = new Date(results.data[results.data.length-1]['utc']*1000);
                title += ' for ';
                if (timeframe !== 'months' && timeframe !== 'weeks') title += months[titleDate.getMonth()] + '  ';
                if (timeframe === 'hours') title += titleDate.getDate() + ', ';
                title += titleDate.getFullYear();
            }
            $('h2#title').text( title);

            lineconfig.options.scales.x.title.text = axisNames[timeframe];
            if (linechart) linechart.destroy();
            linechart = new Chart(linectx, lineconfig);
        },
        'json'
    );
};  // end drawLineChart()

function drawbarChart(bartype) {
    $('#linebox, #linecontrols').hide(); $('#barbox, #barcontrols').show();

    $.post('looma-database-utilities.php',
        {cmd: 'getLogData', type:bartype},
        function(results) {
            // most-used first (top of the horizontal bar chart)
            var rows = results.data.slice().sort(function (a, b) { return b['hits'] - a['hits']; });

            bardata.datasets[0].data = [];
            bardata.labels = [];
            for (var i=0; i < rows.length; i++) {
                bardata.datasets[0].data[i] = rows[i]['hits'];
                bardata.labels[i] = (bartype === 'pages') ? rows[i]['page'] : rows[i]['ft'];
            }

            bardata.datasets[0]['label'] = LOOMA.capitalize(bartype);
            $('h2#title').text( LOOMA.capitalize(bartype) + ' used since October 1, 2021 ');

            if (barchart) barchart.destroy();
            barchart = new Chart(barctx, barconfig);
        },
        'json'
    );
}  //  end drawbarChart()

$(document).ready( function () {

    var tf = 'days'; var prev = 0;

    toolbar_button_activate('info');

    $("input[type=radio][name='timeframe']").change(function(e) {
        tf = $("input[name='timeframe']:checked").val();
        prev = 0;
        drawLineChart(tf,0);
    });

    $("input[type=radio][name='bartype']").change(function(e) {
        var bartype = $("input[name='bartype']:checked").val();
        drawbarChart(bartype);
    });

    $('#next').click(function() {
        if (prev > 0) prev--; drawLineChart(tf,prev);
    });
    $('#prev').click(function() {
        prev++; drawLineChart(tf,prev);
    });
    $('#line').click(function() {drawLineChart(tf,prev);});
    $('#bar').click(function() {drawbarChart($("input[name='bartype']:checked").val());});
    $('#map').click(function() {parent.location.href = 'map?id=61b918f7cea055bc07f6620b';});

    linectx = document.getElementById('linechart').getContext('2d');
    barctx  = document.getElementById('barchart').getContext('2d');

    drawLineChart(tf,prev);

});

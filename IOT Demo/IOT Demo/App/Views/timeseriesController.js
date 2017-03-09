'use strict';
app.controller('timeseriesController', ['$scope', '$http', '$interval', 'dataService', function ($scope, $http, $interval, dataService) {
    $scope.TSattributes = [
     { Name: "Bearing oil health", Selected: true },
     { Name: "Avg. set point over past 5m", Selected: true },
     { Name: "Peak set point over past 5m", Selected: false },
     { Name: "Set point", Selected: false }   
    ];
    
    var chart;
    var chartDataArray;

    $scope.init = function () {

        
        attributes = _.pluck($scope.TSattributes, 'Name');

        var mostRecentDataFromPISystem = dataService.getPloValues(attributes).then(function (response) {
            console.log(response);
        });

    };
    
    $scope.toggle = function (selectedAttribute) {

        selectedAttribute.Selected = !selectedAttribute.Selected;


    };


    // Formats the global data array into a format usable by the chart
    
    //function createFormattedDataArrayForChart() {
    //    // Update the chart data array with the currently selected item's data
    //    chartDataArray = [];
    //    // For each item in the returned data...
    //    var currentDataItemIndex = document.getElementById("plotDataItemSelector").value;
    //    for (var i = 0; i < mostRecentDataFromPISystem[currentDataItemIndex].Items.length; i++) {
    //        // Build an event object that contains the timestamp, formatted as a nice string, the value, and the units
    //        var MyNewEvent = {
    //            "FormattedTimestamp": myFormatTimestampFunction(new Date(mostRecentDataFromPISystem[currentDataItemIndex].Items[i]["Timestamp"])),
    //            "Value": mostRecentDataFromPISystem[currentDataItemIndex].Items[i]["Value"],
    //            "UnitsAbbreviation": mostRecentDataFromPISystem[currentDataItemIndex].Items[i]["UnitsAbbreviation"]
    //        };
    //        // Store the event in the array of data that will be used for plotting
    //        chartDataArray[i] = MyNewEvent;
    //    }
    //};

    // Creates the custom chart!
    //function createChart() {

    //    // Create a chart in the DIV with the ID specified here
    //    chart = AmCharts.makeChart("MyChartDiv", {
    //        "type": "serial",
    //        "theme": "dark",
    //        // Use the array of data that was passed in
    //        "dataProvider": chartDataArray,
    //        "dataDateFormat": "YYYY-MM-DD HH:NN:SS",
    //        "titles": [{
    //            "text": mostRecentDataFromPISystem[document.getElementById("plotDataItemSelector").value].Name,
    //            "size": 15
    //        }],
    //        "valueAxes": [{
    //            "axisAlpha": 0,
    //            "position": "left",
    //            "tickLength": 0
    //        }],
    //        "graphs": [{
    //            // Create a custom popup that contains the FormattedTimestamp and value fields from each data event
    //            "balloonText": "<b><span style='font-size:14px;'>Timestamp: [[FormattedTimestamp]]<br>Value: [[value]]</span></b>",
    //            "bullet": "round",
    //            "bulletSize": 3,
    //            //"dashLength": 3,
    //            "valueField": "Value"
    //        }],
    //        "chartScrollbar": {
    //            "scrollbarHeight": 2,
    //            "offset": -1,
    //            "backgroundAlpha": 0.1,
    //            "backgroundColor": "#888888",
    //            "selectedBackgroundColor": "#67b7dc",
    //            "selectedBackgroundAlpha": 1,
    //            "dragIcon": "dragIconRectSmall.png"

    //        },
    //        "chartCursor": {
    //            "fullWidth": true,
    //            "valueLineEabled": true,
    //            "valueLineBalloonEnabled": true,
    //            "valueLineAlpha": 0.5,
    //            "cursorAlpha": 0
    //        },
    //        "categoryField": "FormattedTimestamp",
    //        "categoryAxis": {
    //            "axisAlpha": 0,
    //            "gridAlpha": 0.1,
    //            "minorGridAlpha": 0.1,
    //            "minorGridEnabled": true,
    //            "autoRotateCount": 10,
    //            "autoRotateAngle": 90
    //        }
    //    });


    //};



}]);
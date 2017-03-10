'use strict';
app.controller('timeseriesController', ['$scope', '$http', '$interval', 'dataService', function ($scope, $http, $interval, dataService) {
    $scope.TSattributes = [
        { Name: "Bearing oil health", Selected: false },
        { Name: "Set point", Selected: false },
        { Name: "X-axis acceleration", Selected: true },
        { Name: "Y-axis acceleration", Selected: true },
        { Name: "Z-axis acceleration", Selected: true }

    ];
    var stop;

    var chart;
  //  var chartDataArray;
    var mostRecentDataFromPISystem;

    $scope.init = function () {

        
        var attributes = _.pluck($scope.TSattributes, 'Name');
        //first response to get first data chunk fast
        dataService.getPloValues(attributes).then(function (response) {
            mostRecentDataFromPISystem = response.data.Items;
            updateChartData();
            console.log(mostRecentDataFromPISystem);
        });

        stop = $interval(function () {
            dataService.getPloValues(attributes).then(function (response) {
                mostRecentDataFromPISystem = response.data.Items;
                updateChartData();
            });

        }, 5000);
       

    };

    $scope.$on('$destroy', function () {
        stopInt();
    });

    function stopInt() {
        if (angular.isDefined(stop)) {
            $interval.cancel(stop);
            stop = undefined;
        };

    };
    
    $scope.toggle = function (selectedAttribute) {

        selectedAttribute.Selected = !selectedAttribute.Selected;
        updateChartData();
    };



    var chartDef = {
        "type": "serial",
        "theme": "dark",
        // Use the array of data that was passed in
        "dataProvider": [],
        "dataDateFormat": "YYYY-MM-DD HH:NN:SS",
        "titles": [{
            "text": '', //mostRecentDataFromPISystem[document.getElementById("plotDataItemSelector").value].Name,
            "size": 1
        }],
        "valueAxes": [{
            "axisAlpha": 0,
            "position": "left",
            "tickLength": 0
        }],
        "graphs": [],
        "chartScrollbar": {
            "scrollbarHeight": 2,
            "offset": -1,
            "backgroundAlpha": 0.1,
            "backgroundColor": "#888888",
            "selectedBackgroundColor": "#67b7dc",
            "selectedBackgroundAlpha": 1//,
            //"dragIcon": "dragIconRectSmall.png"

        },
        "chartCursor": {
            "fullWidth": true,
            "valueLineEabled": true,
            "valueLineBalloonEnabled": true,
            "valueLineAlpha": 0.5,
            "cursorAlpha": 0
        },
        "legend": {
            "useGraphSettings": false,
            "labelText": "[[title]]",
            "valueText": "",
            "fontSize": 9,
            "equalWidths": false,
            "markerSize": 9
        },
        //"categoryField": "FormattedTimestamp",
        "categoryField": "TwoLineFormattedTimestamp",
        "categoryAxis": {
            "dateFormats": [{period:'hh',format:'JJ:NN'}],
            "axisAlpha": 0,
            "gridAlpha": 0.1,
            "minorGridAlpha": 0.1,
            "minorGridEnabled": true,
            "autoRotateCount": 10,
            "autoRotateAngle": 0,//90,
            "fontSize": 9
        }
    };


    //Creates the custom chart!
    $scope.createChart = function() {

        // Create a chart in the DIV with the ID specified here
        chart = AmCharts.makeChart("MyChartDiv", chartDef);


    };

    function updateChartData() {

        if (!mostRecentDataFromPISystem || !chart) return;

        var chartDataArray = [];

        var graphArray = [];

        $scope.TSattributes.forEach(function (attribute) {
            if (!attribute.Selected) return;

                var graph = {};
                graph['balloonText'] = "<b><span style='font-size:14px;'>Timestamp: [[FormattedTimestamp]]<br>Value: [[" + attribute.Name + " Value]][[" + attribute.Name + " UnitsAbbreviation]]</span></b>";
                graph['bullet'] = "round";
                graph['bulletSize'] = 3;
                graph['valueField'] = attribute.Name + ' Value';
                graph['title'] = attribute.Name;

                graphArray.push(graph);


            _.findWhere(mostRecentDataFromPISystem, { Name: attribute.Name }).Items.forEach(function (dataItem) {
                if (!dataItem.Good) return;
                
                var item = {};
                item[attribute.Name + ' Value'] = dataItem.Value;
                item['FormattedTimestamp'] = myFormatTimestampFunction(new Date(dataItem.Timestamp));
                item['TwoLineFormattedTimestamp'] = myTwoLineFormatTimestampFunction(new Date(dataItem.Timestamp));
                item[attribute.Name + ' UnitsAbbreviation'] = dataItem.UnitsAbbreviation;
                item['AttributeNames'] = [attribute.Name];


                var match;
                if (chartDataArray) match = _.findWhere(chartDataArray, { FormattedTimestamp: item.FormattedTimestamp });
                if (match && !_.contains(match.AttributeNames,item.AttributeNames[0])) {
                    match.AttributeNames.push(item.AttributeNames[0]);
                    _.defaults(chartDataArray[_.indexOf(chartDataArray,match)], item);
                    return;
                };

                chartDataArray.push(item);



            });

        });
        chartDataArray = _.sortBy(chartDataArray, 'FormattedTimestamp');


        chart.dataProvider = chartDataArray;
        chart.graphs = graphArray;

        chart.validateData();
        chart.animateAgain();
    };

    // Converts a date object to a small date string
    function myFormatTimestampFunction(MyDateObject) {
        var MyDateString = "";
        MyDateString = MyDateObject.getFullYear()
            + "-"
            + myPrependZeroIfNeededFunction(1 + MyDateObject.getMonth())
            + "-"
            + myPrependZeroIfNeededFunction(MyDateObject.getDate())
            + " "
            + myPrependZeroIfNeededFunction(MyDateObject.getHours())
            + ":"
            + myPrependZeroIfNeededFunction(MyDateObject.getMinutes())
            + ":"
            + myPrependZeroIfNeededFunction(MyDateObject.getSeconds());
        return MyDateString;
    };
    // Converts a date object to a small date string on two lines
    function myTwoLineFormatTimestampFunction(MyDateObject) {
        var MyDateString = "";
        MyDateString = MyDateObject.getFullYear()
            + "-"
            + myPrependZeroIfNeededFunction(1 + MyDateObject.getMonth())
            + "-"
            + myPrependZeroIfNeededFunction(MyDateObject.getDate())
            + "\n"
            + myPrependZeroIfNeededFunction(MyDateObject.getHours())
            + ":"
            + myPrependZeroIfNeededFunction(MyDateObject.getMinutes())
            + ":"
            + myPrependZeroIfNeededFunction(MyDateObject.getSeconds());
        return MyDateString;
    };
    // Prepends a zero to a number if necessary when building a date string, to ensure 2 digits are always present
    function myPrependZeroIfNeededFunction(MyNumber) {
        if (MyNumber < 10) {
            return ("0" + MyNumber);
        } else {
            return (MyNumber);
        }
    };

}]);
'use strict';
app.controller('chartController', ['$scope', '$http', '$interval', '$stateParams', 'dataService', function ($scope, $http, $interval,$stateParams, dataService) {

    var afTemplate = 'Asset Template';
    var assetName = $stateParams.assetName;
    var afAttributeCategory = 'Timeseries';


    var stop;
    $scope.$on('$destroy', function () {
        stopInt();
    });

    function stopInt() {
        if (angular.isDefined(stop)) {
            $interval.cancel(stop);
            stop = undefined;
        };

    };


    var chart;
    var mostRecentDataFromPISystem;

    $scope.init = function () {
   
        dataService.getElementAttributes(afTemplate, assetName, afAttributeCategory).then(function (attributes) {

            $scope.attributes = _.map(attributes, function (attribute) { return {Name: attribute.Name, Selected: true}});

            dataService.getPloValues(attributes).then(function (response) {

                mostRecentDataFromPISystem = response.data.Items;
                updateChartData();
            });

            stop = $interval(function () {
                dataService.getPloValues(attributes).then(function (response) {

                    mostRecentDataFromPISystem = response.data.Items;
                    updateChartData();
                });
            }, 5000);

            
        });


    };


    
    $scope.toggle = function (selectedAttribute) {

        selectedAttribute.Selected = !selectedAttribute.Selected;
        updateChartData();
    };



    var chartDef = {
        "type": "serial",
        "theme": "dark",
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
        "categoryField": "TwoLineFormattedTimestamp",
        "categoryAxis": {
            "dateFormats": [{ period: 'hh', format: 'JJ:NN' }],
            "axisAlpha": 0,
            "gridAlpha": 0.1,
            "minorGridAlpha": 0.1,
            "minorGridEnabled": true,
            "autoRotateCount": 10,
            "autoRotateAngle": 0,
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

        $scope.attributes.forEach(function (attribute) {
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
        //chartDataArray = _.sortBy(chartDataArray, 'FormattedTimestamp');


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
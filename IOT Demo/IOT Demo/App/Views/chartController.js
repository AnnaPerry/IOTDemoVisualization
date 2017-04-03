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
        "dataProvider": [],
        "color": "white",
        "autoMargins": false,
        "marginLeft": 20,
        "marginRight": 20,
        "marginTop": 10,
        "marginBottom": 55,
        "dataDateFormat": "YYYY-MM-DD HH:NN:SS",
        "backgroundColor": "#303030",
        "backgroundAlpha": 1,
        "valueAxes": [{
            "axisAlpha": 1,
            "position": "left",
            "axisColor": "white",
            "fillAlpha": 0.05,
            "inside":true
        }],
        "graphs": [],
        "chartCursor": {
            "cursorAlpha": 1,
            "cursorColor": "white",
            "categoryBalloonColor": "#202020"
        },
        "legend": {
            "useGraphSettings": false,
            "labelText": "[[title]]",
            "valueText": "",
            "fontSize": 9,
            "equalWidths": false,
            "markerSize": 9,
            "color": "white",
            "autoMargins": false,
            "marginTop": 0,
            "marginBottom": 5,
            "position":"top"
        },
        "categoryField": "TwoLineFormattedTimestamp",
        "categoryAxis": {
            "dateFormats": [{ period: 'hh', format: 'JJ:NN' }],
            "axisAlpha": 1,
            "gridAlpha": 0,
            "autoRotateCount": 10,
            "autoRotateAngle": 0,
            "fontSize": 9,
            "color": "white",
            "axisColor": "white"
        },
        "zoomOutButtonImage": "",
        "creditsPosition":"top-right"
    };


    //Creates the custom chart!
    $scope.createChart = function() {

        // Create a chart in the DIV with the ID specified here
        chart = AmCharts.makeChart("MyChartDiv", chartDef);


    };

    function updateChartData() {

        // Remember previous graph settings
        var previousGraphArray;
        if (chart.graphs) {
            previousGraphArray = chart.graphs;
        }

        if (!mostRecentDataFromPISystem || !chart) return;

        var chartDataArray = [];

        var graphArray = [];

        $scope.attributes.forEach(function (attribute) {
            if (!attribute.Selected) return;

                var graph = {};
                graph['balloonText'] = attribute.Name + ": [[" + attribute.Name + " Value]][[" + attribute.Name + " UnitsAbbreviation]]";
                graph['bullet'] = "round";
                graph['bulletSize'] = 3;
                graph['bulletAlpha'] = 0;
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

        // If this item was previously hidden, then hide it again!
        if (previousGraphArray) {
            // Loop through all the graphs...
            for (var i = 0; i < chart.graphs.length; i++) {

                // Loop through all of the previous graphs...
                for (var j = 0; j < previousGraphArray.length; j++) {

                    // If these graph titles match
                    if (previousGraphArray[j].title == chart.graphs[i].title) {

                        // And if the graph used to be hidden, hide it again!
                        if (previousGraphArray[j].hidden) {

                            chart.hideGraph(chart.graphs[i]);

                        }
                        // Break out of the loop
                        j = previousGraphArray.length;
                    }
                }
            }
        }
        // Update the chart formatting (leave its data alone)
        chart.validateNow;

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
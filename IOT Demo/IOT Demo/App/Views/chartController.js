'use strict';
app.controller('chartController', ['$scope', '$http', '$interval', '$stateParams', 'dataService', function ($scope, $http, $interval,$stateParams, dataService) {

    var afTemplate = 'Asset Template';
    var assetName = $stateParams.assetName;
    var afAttributeCategory = 'Timeseries';
    var stop;		

	// Specify how often should the visualization be updated (and new data requested from the PI System)
	var DATA_REFRESH_INTERVAL_IN_MILLISECONDS = 5000;

    // When this scope is closed, stop the recurring interval timer
    $scope.$on('$destroy', function () {
        stopInt();
    });

	// Function that allows you to stop the recurring interval timer
    function stopInt() {
        if (angular.isDefined(stop)) {
            $interval.cancel(stop);
            stop = undefined;
        };
    };

	// Global variables for storing the chart object AND the most recently received data from the PI System
    var chart;
    var mostRecentDataFromPISystem;

    // Specify the default of whether or not to use multiple chart axes!  Note: this is also set later...
    var USE_MULTIPLE_AXES = true;
	
	// Init function: get attributes for this element, store them in scope, and then get values for those attributes
    $scope.init = function () {
		document.getElementById("loadingSpinner2").style.display = "inline";
         dataService.getElementAttributes(afTemplate, assetName, afAttributeCategory).then(function (attributes) {
            $scope.attributes = _.map(attributes, function (attribute) { return {Name: attribute.Name}});
            dataService.getInterpolatedValues(attributes).then(function (response) {
                mostRecentDataFromPISystem = response.data.Items;
                updateChartData();
				// Turn off the loading spinner
				document.getElementById("loadingSpinner2").style.display = "none";
            });

            stop = $interval(function () {
                dataService.getInterpolatedValues(attributes).then(function (response) {
                    mostRecentDataFromPISystem = response.data.Items;
                    updateChartData();
                });
            }, DATA_REFRESH_INTERVAL_IN_MILLISECONDS);
        });
    };

    // Define an array of colors used for the chart traces
    var chartColors = ["rgb(62, 152, 211)", "rgb(224, 138, 0)", "rgb(178, 107, 255)", "rgb(47, 188, 184)", "rgb(219, 70, 70)", "rgb(156, 128, 110)", "rgb(60, 191, 60)", "rgb(197, 86, 13)","rgb(46, 32, 238)","rgb(165, 32, 86)" ];

    var chartDef = {
        "type": "serial",
        "dataProvider": [],
        "color": "white",
		"backgroundAlpha": 0,
        "dataDateFormat": "YYYY-MM-DD HH:NN:SS",
        "graphs": [],
		"valueAxes": [
			{
                "axisAlpha": 1,
				"axisColor": "white",
                "fillAlpha": 0,
				"gridAlpha": 0
            }
		],
        "legend": {
            "labelText": "[[title]]",
            "valueText": "",
            "fontSize": 10,
            "equalWidths": false,
			"markerLabelGap":0,
            "markerSize": 0,
			"useMarkerColorForLabels":true,
            "position":"top"
        },
        "categoryField": "TwoLineFormattedTimestamp",
        "categoryAxis": {
            "dateFormats": [{ period: 'hh', format: 'JJ:NN' }],
            "gridAlpha": 0,
            "fontSize": 9,
            "color": "white",
            "axisColor": "white"
        },
        "zoomOutButtonImage": "",
        "creditsPosition": "top-right",
        "colors": chartColors
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

        // Declare empty arrays to hold data, graphs, and axes
        var chartDataArray = [];
        var graphArray = [];
        var axisArray = []

        // Note! If the number of data items is over 4, turn off multiple axes!
        if ($scope.attributes.length > 4) {
            USE_MULTIPLE_AXES = false;
        }

        // For each attribute...
        var axisNumber = 0;
        $scope.attributes.forEach(function (attribute) {

            // Create a new value axis
            var newValueAxis = {
                "id": attribute.Name,
                "axisAlpha": 1,
				"axisColor": "white",
                "color": chartColors[axisNumber],
                "fillAlpha": 0,
				"gridAlpha": 0,
                "labelOffset": axisNumber * 35
            };
            axisNumber++;

            // Create a new graph
            var graph = {};
            graph['balloonText'] = attribute.Name + ": [[" + attribute.Name + " Value]] [[" + attribute.Name + " UnitsAbbreviation]]";
            graph['bullet'] = "round";
            graph['bulletSize'] = 3;
            graph['bulletAlpha'] = 0;
            graph['valueField'] = attribute.Name + ' Value';
            graph['title'] = attribute.Name;
			
            // Optional: associate this graph with the new axis
            if (USE_MULTIPLE_AXES == true) {
                graph['valueAxis'] = attribute.Name;
            }

            // Add this graph and axis to their respective arrays
            graphArray.push(graph);
            axisArray.push(newValueAxis);

            // Now create the array of data that will actually be plotted!
            _.findWhere(mostRecentDataFromPISystem, { Name: attribute.Name }).Items.forEach(function (dataItem) {
                if (isNaN(dataItem.Value)) return;
                
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

        // Assign the new arrays to the chart object
        chart.dataProvider = chartDataArray;
        chart.graphs = graphArray;
        //Optional: assign the custom value axes!
        if (USE_MULTIPLE_AXES == true) {
            chart.valueAxes = axisArray;
        }

        // Refresh the chart
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
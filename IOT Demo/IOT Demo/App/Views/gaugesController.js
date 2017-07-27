'use strict';
app.controller('gaugesController', ['$scope', '$http', '$interval', '$stateParams', 'dataService', function ($scope, $http, $interval,$stateParams, dataService) {

    var afTemplate = 'Asset Template';
    var assetName = $stateParams.assetName;
    var afAttributeCategory = 'Timeseries';

	// Specify the default of whether or not to use multiple chart axes!  Note: this is also set later...
    var USE_MULTIPLE_AXES = true;
	
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
	
	// Specify how often should the visualization be updated (and new data requested from the PI System)
	var DATA_REFRESH_INTERVAL_IN_MILLISECONDS = 3000;

	// Global variables for storing the chart object AND the most recently received data from the PI System
    var chart;
    var mostRecentDataFromPISystem;
	
	// Init function: get attributes for this element, store them in scope, and then get values for those attributes
    $scope.init = function () {
		document.getElementById("loadingSpinner2").style.display = "inline";
         dataService.getElementAttributes(afTemplate, assetName, afAttributeCategory).then(function (attributes) {
            $scope.attributes = _.map(attributes, function (attribute) { return {Name: attribute.Name, Selected: true}});
            dataService.getSnapshots(attributes).then(function (response) {
			//dataService.getPloValues(attributes).then(function (response) {
                mostRecentDataFromPISystem = response.data.Items;
                updateChartData();
				// Turn off the loading spinner
				document.getElementById("loadingSpinner2").style.display = "none";
				// Show the "shake me!" modal for phone-based assets!
				if (dataService.isFirstTimeThisPageHasLoaded() && (assetName.substring(0,6) == "Asset ")) { 
					$("#shakeMeModal").modal();
				}
            });

            stop = $interval(function () {
                dataService.getSnapshots(attributes).then(function (response) {
				//dataService.getPloValues(attributes).then(function (response) {
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
		"fontSize": 13,
        "dataProvider": [],
        "color": "white",
        "valueAxes": [{
            "axisColor": "white",
            "fillAlpha": 0,
			"fontSize": 10
        }],
        "graphs": [{
			"balloonText": "[[category]]\n[[valueFormatted]][[units]]",
			"labelText": "[[valueFormatted]]\n[[units]]",
			"fillAlphas": 1,
			"lineAlpha": 0,
			"type": "column",
			"valueField": "value",
			"colorField": "color",
            "fontSize": 12,
            "showAllValueLabels": true
		}],
        "categoryField": "name",
        "categoryAxis": {
			"axisColor": "white",
            "gridAlpha": 0,
			"labelsEnabled":true
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
		for (var i = 0; i < mostRecentDataFromPISystem.length; i++) {

			var dataObject = {
				"name": mostRecentDataFromPISystem[i].Name.replace(" ","\n").replace("-","-\n"),
				"value": mostRecentDataFromPISystem[i].Value.Value,
				"valueFormatted": mostRecentDataFromPISystem[i].Value.Value.toFixed(1),
				"timestamp": mostRecentDataFromPISystem[i].Value.Timestamp,
				"color": chartColors[i],
				"units": mostRecentDataFromPISystem[i].Value.UnitsAbbreviation
			};
			chartDataArray.push(dataObject);
		}
		
        // Assign the new arrays to the chart object
        chart.dataProvider = chartDataArray;

		//console.log(chartDataArray);
        // Refresh the chart
        chart.validateData();
        chart.animateAgain();

        // Update the chart formatting (leave its data alone)
        chart.validateNow;

    };
	
}]);
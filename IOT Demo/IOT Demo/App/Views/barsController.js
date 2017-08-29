'use strict';
app.controller('barsController', ['$scope', '$http', '$stateParams', 'dataService', function ($scope, $http,$stateParams, dataService) {

    var afTemplate = 'Asset Template';
    var assetName = $stateParams.assetName;
    var afAttributeCategory = 'Timeseries';
	var includeAttributeNameInQueryResults = false;
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
			clearTimeout(stop);
            stop = undefined;
        };
    };

	// Global variables for storing the chart object AND the most recently received data from the PI System
    var chart;
    var mostRecentDataFromPISystem;
	
	// Init function: get attributes for this element, store them in scope, and then get values for those attributes
    $scope.init = function () {
		// Show the loading spinner
		document.getElementById("loadingSpinnerIcon").className = "fa fa-spinner fa-spin fa-fw";
         dataService.getElementAttributes(afTemplate, assetName, afAttributeCategory, includeAttributeNameInQueryResults).then(function (attributes) {	
			// Turn off the loading spinner
			document.getElementById("loadingSpinnerIcon").className = "fa fa-refresh fa-fw"; 
			// Show the "shake me!" modal for phone-based assets!
			if (dataService.isFirstTimeThisPageHasLoaded() && (assetName.substring(0,6) == "Asset ")) { 
				// NEW: check to make sure this isn't a read-only asset!
				if (assetName.toLowerCase().indexOf("read only") == -1) {
					$("#shakeMeModal").modal();
				}
			}
			performRepetitiveActionsForTheseAFAttributes(attributes);
        });
    };
	
	// Repetitive function!  Contains behavior for getting data and acting on it
	function performRepetitiveActionsForTheseAFAttributes(attributes) {
		dataService.getSnapshots(attributes).then(function (response) {
			try {
				mostRecentDataFromPISystem = response.data.Items;
				updateChartData();
			} catch (err) {
				console.log("An error ocurred during the main loop: " + err.message);
			}
		});		
		// Call this function again after a certain time range
		stop = setTimeout( function() {
			performRepetitiveActionsForTheseAFAttributes(attributes)
		}, DATA_REFRESH_INTERVAL_IN_MILLISECONDS);		
	}

    // Define an array of colors used for the chart traces
    var chartColors = ["rgb(62, 152, 211)", "rgb(224, 138, 0)", "rgb(178, 107, 255)", "rgb(47, 188, 184)", "rgb(219, 70, 70)", "rgb(156, 128, 110)", "rgb(60, 191, 60)", "rgb(197, 86, 13)","rgb(46, 32, 238)","rgb(165, 32, 86)" ];

    var chartDef = {
        "type": "serial",
        "fontSize": 13,
        "dataProvider": [],
        "color": "white",
		"backgroundAlpha": 0,
		"titles": [
			{
				"text": assetName,
				"size": 11,
				//"bold": false
			}
		],
        "valueAxes": [{
            "id": "a1",
            "axisColor": "white",
            "fontSize": 10,
			"tickLength": 3,
			"gridAlpha": 0
        }, {
            "id": "a2",
            "axisColor": "white",
            "fontSize": 10,
			"tickLength": 3,
			"gridAlpha": 0
            }],
        "graphs": [{
            "id": "g1",
			"balloonText": assetName + "\n" + "[[category]]\n[[valueFormatted]][[units]]",
			"labelText": "[[valueFormatted]]\n[[units]]",
			"fillAlphas": 1,
			"lineAlpha": 0,
			"type": "column",
			"valueField": "rotation",
			"colorField": "color",
            "fontSize": 12,
            "showAllValueLabels": true,
            "valueAxis": "a1"
        }, {
			"id": "g2",
			"balloonText": assetName + "\n" + "[[category]]\n[[valueFormatted]][[units]]",
			"labelText": "[[valueFormatted]]\n[[units]]",
			"fillAlphas": 1,
			"lineAlpha": 0,
			"type": "column",
			"valueField": "value",
			"colorField": "color",
			"fontSize": 12,
			"showAllValueLabels": true,
			"valueAxis": "a2"
        }
        ],
        "categoryField": "name",
        "categoryAxis": {
			"axisColor": "white",
            "gridAlpha": 0,
			"tickLength": 0
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
       
		// Set a flag to detect if we should be using a second axis to create a separate scale from spin data;
		// this is only true if spin data is inside the result
		var useSecondAxisForNonSpinData = false;

        // For each attribute...
        var axisNumber = 0;
        for (var i = 0; i < mostRecentDataFromPISystem.length; i++) {
            //console.log(mostRecentDataFromPISystem);
            //console.log(mostRecentDataFromPISystem[i].Name)

            //declare storage for data to be put on chart 
            var dataObject = {};

			// Format the value!
			var formattedValue = 0;
			try {
				formattedValue = mostRecentDataFromPISystem[i].Value.Value.toFixed(1);
			}
			catch(err) {
				console.log("Error while trying to parse vales for the gauge: ", err.message);
			}
			
            //check to see if we are looking at a spin reading 
            if (mostRecentDataFromPISystem[i].Name.indexOf("spin") != -1) {           
                //if it is a spin reading -- add this to the rotation axis
                dataObject = {
                    "name": mostRecentDataFromPISystem[i].Name.replace(" ", "\n").replace("-", "-\n"),
                    "rotation": mostRecentDataFromPISystem[i].Value.Value,
                    "valueFormatted": formattedValue,
                    "timestamp": mostRecentDataFromPISystem[i].Value.Timestamp,
                    "color": chartColors[i],
                    "units": mostRecentDataFromPISystem[i].Value.UnitsAbbreviation
                };
				
				// Note this result!  Later, reposition the second axis!
				useSecondAxisForNonSpinData = true;				
            }

            //if it is not a spin reading -- add this to the other axis
            else {
                dataObject = {
                    "name": mostRecentDataFromPISystem[i].Name.replace(" ", "\n").replace("-", "-\n"),
                    "value": mostRecentDataFromPISystem[i].Value.Value,
                    "valueFormatted": formattedValue,
                    "timestamp": mostRecentDataFromPISystem[i].Value.Timestamp,
                    "color": chartColors[i],
                    "units": mostRecentDataFromPISystem[i].Value.UnitsAbbreviation
                };
            }

            chartDataArray.push(dataObject);
            //console.log(dataObject);
		}
		
        // Assign the new arrays to the chart object
        chart.dataProvider = chartDataArray;
		
		// Refresh the chart
        chart.validateData();
		
								
		// Update the second value axis position!
		if (chart.categoryAxis.allLabels && (useSecondAxisForNonSpinData == true)) {	
			chart.valueAxes[1].offset = ( (2/3)*(chart.categoryAxis.allLabels[3].x - chart.categoryAxis.allLabels[2].x) + chart.categoryAxis.allLabels[2].x )  * -1; //-100;
		}
		
        // Update the chart formatting (leave its data alone)
        chart.validateNow();

    };
	
}]);
'use strict';
app.controller('mainController', ['$scope', '$stateParams', 'dataService', function ($scope, $stateParams, dataService) {
    
	// Get all of the buttons that should only be shown when an asset has selected, and set their correct visibility
	var buttonElements = document.getElementsByClassName("showChartBarAndTableButtonsClass");
	for (var i = 0; i < buttonElements.length; i++) {
		buttonElements[i].style.display = "none";
		//buttonElements[i].style.display = "block";
	}
	
    //var afTemplate = 'Top-Level Assets Template';
	//var assetName = 'Assets';
	var afTemplate = DEFAULT_TOP_LEVEL_ASSET_AF_TEMPLATE;
	var assetName = DEFAULT_TOP_LEVEL_ASSET_NAME;
    var afAttributeCategory = DEFAULT_TOP_LEVEL_ASSET_ATTRIBUTE_CATEGORY;
	var includeAttributeNameInQueryResults = false;
    var stop;	
	
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
	
	// Global variables for storing the chart object
    var chart;
	var mostRecentDataFromPISystem;
	
	// On load, get snapshot values...
    $scope.init = function () {
		// Show the loading spinner
		document.getElementById("loadingSpinnerIcon").className = "fa fa-spinner fa-spin fa-fw";
		// Get attributes, then snapshot values, for the top-level element
		dataService.getElementAttributes(afTemplate, assetName, afAttributeCategory, includeAttributeNameInQueryResults).then(function (attributes) {
			// Turn off the loading spinner
			document.getElementById("loadingSpinnerIcon").className = "fa fa-refresh fa-fw"; 
			performRepetitiveActionsForTheseAFAttributes(attributes);
		});
    };
	
	// Repetitive function!  Contains behavior for getting data and acting on it
	function performRepetitiveActionsForTheseAFAttributes(attributes) {
		dataService.getSnapshots(attributes).then(function (response) {
			try {
				mostRecentDataFromPISystem = response.data.Items;
			} catch (err) {
				console.log("An error occurred when trying to read the response data.Items: " + err.message);
			}
			try {
				// Update the chart
				updateChartData();
			} catch (err) {
				console.log("An error occurred when trying to update the chart: " + err.message);
			}
		});
		// Call this function again after a certain time range
		stop = setTimeout( function() {
			performRepetitiveActionsForTheseAFAttributes(attributes)
		}, DATA_REFRESH_INTERVAL_IN_MILLISECONDS);
	}

    $scope.makeCrazyGauge = function () {
        chart = AmCharts.makeChart("crazyGaugeDiv", chartDef);
    };

    var updateChartData = function () {
        if (!chart) return;

        // Update the even numbered bands with data
        chart.axes[0].bands[1].setEndValue(isNaN(mostRecentDataFromPISystem[0].Value.Value) ? 0 : mostRecentDataFromPISystem[0].Value.Value);
        chart.axes[0].bands[3].setEndValue(isNaN(mostRecentDataFromPISystem[1].Value.Value) ? 0 : mostRecentDataFromPISystem[1].Value.Value);
        chart.axes[0].bands[5].setEndValue(isNaN(mostRecentDataFromPISystem[2].Value.Value) ? 0 : mostRecentDataFromPISystem[2].Value.Value);
        chart.axes[0].bands[7].setEndValue(isNaN(mostRecentDataFromPISystem[3].Value.Value) ? 0 : mostRecentDataFromPISystem[3].Value.Value);

        // Update the labels
        chart.allLabels[0].text = mostRecentDataFromPISystem[0].Name + ": " + chart.axes[0].bands[1].endValue.toFixed(3) + " " + mostRecentDataFromPISystem[0].Value.UnitsAbbreviation;
        chart.allLabels[1].text = mostRecentDataFromPISystem[1].Name + ": " + chart.axes[0].bands[3].endValue.toFixed(3) + " " + mostRecentDataFromPISystem[1].Value.UnitsAbbreviation;
        chart.allLabels[2].text = mostRecentDataFromPISystem[2].Name + ": " + chart.axes[0].bands[5].endValue.toFixed(3) + " " + mostRecentDataFromPISystem[2].Value.UnitsAbbreviation;
        chart.allLabels[3].text = mostRecentDataFromPISystem[3].Name + ": " + chart.axes[0].bands[7].endValue.toFixed(3) + " " + mostRecentDataFromPISystem[3].Value.UnitsAbbreviation;

        // Loop through all the chart bands as well, and update those based on each data item
        chart.axes[0].bands[1].balloonText = chart.allLabels[0].text;
        chart.axes[0].bands[3].balloonText = chart.allLabels[1].text;
        chart.axes[0].bands[5].balloonText = chart.allLabels[2].text;
        chart.axes[0].bands[7].balloonText = chart.allLabels[3].text;

        // Refresh the chart
        chart.validateNow();
    };

    var chartColors = ["rgb(62, 152, 211)", "rgb(224, 138, 0)", "rgb(178, 107, 255)", "rgb(47, 188, 184)", "rgb(219, 70, 70)", "rgb(156, 128, 110)", "rgb(156, 128, 110)", "rgb(197, 86, 13)"];
    
	var chartAxisMax = 100;
    var chartDef = {
        "type": "gauge",
        "creditsPosition": "top-right",
		"fontSize": 13,
		"backgroundAlpha": 0,
		//"startDuration": 0, // Use this to turn off animation, if desired
        "axes": [{
            "startValue": 0,
            "endValue": chartAxisMax,
            "startAngle": 0,
            "endAngle": 270,
            "inside": false,
            "color":"darkgray",
            "bands": [{
                "color": "#eee",
                "startValue": 0,
                "endValue": chartAxisMax,
                "radius": "100%",
                "innerRadius": "85%"
            }, {
                "color": chartColors[0],
                "startValue": 0,
                "endValue": 0,
                "radius": "100%",
                "innerRadius": "85%",
                "balloonText": "-"
            }, {
                "color": "#eee",
                "startValue": 0,
                "endValue": chartAxisMax,
                "radius": "80%",
                "innerRadius": "65%"
            }, {
                "color": chartColors[1],
                "startValue": 0,
                "endValue": 0,
                "radius": "80%",
                "innerRadius": "65%",
                "balloonText": "-"
            }, {
                "color": "#eee",
                "startValue": 0,
                "endValue": chartAxisMax,
                "radius": "60%",
                "innerRadius": "45%"
            }, {
                "color": chartColors[2],
                "startValue": 0,
                "endValue": 0,
                "radius": "60%",
                "innerRadius": "45%",
                "balloonText": "-"
            }, {
                "color": "#eee",
                "startValue": 0,
                "endValue": chartAxisMax,
                "radius": "40%",
                "innerRadius": "25%"
            }, {
                "color": chartColors[3],
                "startValue": 0,
                "endValue": 0,
                "radius": "40%",
                "innerRadius": "25%",
                "balloonText": "-"
            }]
        }],
        "allLabels": [{
            "text": "-",
            "x": "49%",
            "y": "5%",
            "color": chartColors[0],
            "align": "right"
        }, {
            "text": "-",
            "x": "49%",
            "y": "15%",
            "color": chartColors[1],
            "align": "right"
        }, {
            "text": "-",
            "x": "49%",
            "y": "24%",
            "color": chartColors[2],
            "align": "right"
        }, {
            "text": "-",
            "x": "49%",
            "y": "33%",
            "color": chartColors[3],
            "align": "right"
        }]
    };
}]);
'use strict';
app.controller('mainController', ['$scope', '$interval', 'dataService', function ($scope, $interval, dataService) {

    var afTemplate = 'Top-Level Assets Template';
    var assetName = 'Assets';
    var afAttributeCategory = 'KPIs and Rollups';
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
	
	// Global variables for storing the chart object
    var crazyGaugeChart;

	
	// On load, get snapshot values...
    $scope.init = function () {
		// Show the top navbar
		document.getElementById("mainNavbarContainer").style.display = "block";
		// Show the loading spinner
		document.getElementById("loadingSpinner").style.display = "inline";
		// Get attributes, then snapshot values, for the top-level element
        dataService.getElementAttributes(afTemplate, assetName, afAttributeCategory).then(function (attributes) {
            dataService.getSnapshots(attributes).then(function (response) {
                var dataArray = response.data.Items;
                // Get the first four data items!
                $scope.dataItem1 = dataArray[0];
                $scope.dataItem2 = dataArray[1];
                $scope.dataItem3 = dataArray[2];
                $scope.dataItem4 = dataArray[3];
                // Update the chart
                updatecharts();
				// Turn off the loading spinner
				document.getElementById("loadingSpinner").style.display = "none";
            });
			
			// After the initial get, set up a recurring timer!
            stop = $interval(function () {
                dataService.getSnapshots(attributes).then(function (response) {
                    var dataArray = response.data.Items;
                    // Get the first four data items!
                    $scope.dataItem1 = dataArray[0];
                    $scope.dataItem2 = dataArray[1];
                    $scope.dataItem3 = dataArray[2];
                    $scope.dataItem4 = dataArray[3];
                    // Update the chart
                    updatecharts();
                });
            }, DATA_REFRESH_INTERVAL_IN_MILLISECONDS);
        });
    };

    $scope.makeCrazyGauge = function () {
        crazyGaugeChart = AmCharts.makeChart("crazyGaugeDiv", crazyGaugeChartDef);
    };

    var updatecharts = function () {
        if (!crazyGaugeChart) return;

        // Update the even numbered bands with data
        crazyGaugeChart.axes[0].bands[1].setEndValue(isNaN($scope.dataItem1.Value.Value) ? 0 : $scope.dataItem1.Value.Value);
        crazyGaugeChart.axes[0].bands[3].setEndValue(isNaN($scope.dataItem2.Value.Value) ? 0 : $scope.dataItem2.Value.Value);
        crazyGaugeChart.axes[0].bands[5].setEndValue(isNaN($scope.dataItem3.Value.Value) ? 0 : $scope.dataItem3.Value.Value);
        crazyGaugeChart.axes[0].bands[7].setEndValue(isNaN($scope.dataItem4.Value.Value) ? 0 : $scope.dataItem4.Value.Value);

        // Update the labels
        crazyGaugeChart.allLabels[0].text = $scope.dataItem1.Name + ": " + crazyGaugeChart.axes[0].bands[1].endValue.toFixed(3) + " " + $scope.dataItem1.Value.UnitsAbbreviation;
        crazyGaugeChart.allLabels[1].text = $scope.dataItem2.Name + ": " + crazyGaugeChart.axes[0].bands[3].endValue.toFixed(3) + " " + $scope.dataItem2.Value.UnitsAbbreviation;
        crazyGaugeChart.allLabels[2].text = $scope.dataItem3.Name + ": " + crazyGaugeChart.axes[0].bands[5].endValue.toFixed(3) + " " + $scope.dataItem3.Value.UnitsAbbreviation;
        crazyGaugeChart.allLabels[3].text = $scope.dataItem4.Name + ": " + crazyGaugeChart.axes[0].bands[7].endValue.toFixed(3) + " " + $scope.dataItem4.Value.UnitsAbbreviation;

        // Loop through all the chart bands as well, and update those based on each data item
        crazyGaugeChart.axes[0].bands[1].balloonText = crazyGaugeChart.allLabels[0].text;
        crazyGaugeChart.axes[0].bands[3].balloonText = crazyGaugeChart.allLabels[1].text;
        crazyGaugeChart.axes[0].bands[5].balloonText = crazyGaugeChart.allLabels[2].text;
        crazyGaugeChart.axes[0].bands[7].balloonText = crazyGaugeChart.allLabels[3].text;

        // Update the chart div height
        var newHeightString = ($("#crazyGaugeDiv").parent().innerHeight() - 2) + "px";
        $("#crazyGaugeDiv").height(newHeightString);

        // Refresh the chart
        crazyGaugeChart.validateNow();
    };

    var chartColors = ["rgb(62, 152, 211)", "rgb(224, 138, 0)", "rgb(178, 107, 255)", "rgb(47, 188, 184)", "rgb(219, 70, 70)", "rgb(156, 128, 110)", "rgb(156, 128, 110)", "rgb(197, 86, 13)"];
    var chartAxisMax = 100;
    var crazyGaugeChartDef = {
        "type": "gauge",
        "creditsPosition": "top-right",
		"fontSize": 13,
		"backgroundAlpha": 0,		
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
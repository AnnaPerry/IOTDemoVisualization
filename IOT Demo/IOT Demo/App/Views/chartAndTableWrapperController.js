'use strict';
app.controller('chartAndTableWrapperController', ['$scope', '$stateParams', '$interval', 'dataService', function ($scope, $stateParams, $interval, dataService) {

    var afTemplate = 'Phone Sensors Template';
    var attributeCategory = '*';

    $scope.init = function () {
		// Hide the top navbar; we'll replace it with a new one!
		document.getElementById("mainNavbarContainer").style.display = "none";
    };


    // When this scope is closed, stop the recurring interval timer
    var stop;
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
	
	// Dynamically set widths for image and data div
	$scope.showImageDiv = function () {
		// If the screen is wider than it is tall, the image should appear; otherwise, it should not!
		return (window.innerWidth > window.innerHeight);
	};	
	// If the screen is wider than it is tall, make the chart dive 70% wide; otherwise, make it 100% wide!
	$scope.chartAndTableWidth = function () {
		if (window.innerWidth > window.innerHeight) {
			return '70%';
		} else {
			return '100%';
		}		
	};
	
	// Get the asset type! Used to set image files and show or hide certain buttons
	$scope.getAssetType = function () {
		var imageSource = 'PhoneSensor';
		// If it's a phone-based asset, use the standard phone image
		if ( ($stateParams.assetName).substring(0,6) == "Asset ") {
			imageSource = 'PhoneSensor';
		}
		// If it's a WISE asset...
		else if ( ($stateParams.assetName).substring(0,4) == "WISE") {
			imageSource = 'WISE';
		}
		// If it's a Phidget...
		else if ( ($stateParams.assetName).substring(0,7) == "Phidget") {
			imageSource = 'Phidget';
		}		
		// By default, return the standard phone image
		//console.log("Image source: " + imageSource);
		return imageSource;
	};

    // The interval timer gets the target AF asset and calls the dataservice to send live data from this device's sensors to the PI System
    $scope.sendDatatoPI = function () {
		// Only do this, though, if the current element is asset 1 through 5! Otherwise, don't send data!
		if ( ($stateParams.assetName).substring(0,6) == "Asset ") {
			console.log("Current AF Element is a phone-based element; will start streaming data!");
			stop = $interval(function () {
				var targetAsset = dataService.getTargetAssetElementName($stateParams.assetName);
				dataService.sendDatatoPI(afTemplate, targetAsset, attributeCategory);
			}, 3000);
		} else {
			console.log("Current AF Element does not use a phone-based data source; device sensor data will not be streamed.");
		}
    };

}]);
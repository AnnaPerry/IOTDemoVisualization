'use strict';
app.controller('chartAndTableWrapperController', ['$scope', '$stateParams', '$interval', 'dataService', function ($scope, $stateParams, $interval, dataService) {

    var afTemplate = 'Phone Sensors Template';
    var attributeCategory = '*';
    var stop;	
	var attributesToWriteTo;
	
	// Specify how often should the visualization be updated (and new data requested from the PI System)
	var DATA_REFRESH_INTERVAL_IN_MILLISECONDS = 3000;

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
		
    $scope.init = function () {
		// Hide the top navbar; we'll replace it with a new one!
		document.getElementById("mainNavbarContainer").style.display = "none";
    };

	// Dynamically set widths for image and data div
	$scope.showImageDiv = function () {
		// If the screen is wider than it is tall, the image should appear; otherwise, it should not!
		if (window.innerWidth > window.innerHeight) {
			document.getElementById('dataVisualizationWrapper').style.width = '72%';
			return true;
		} else {
			document.getElementById('dataVisualizationWrapper').style.width = '100%';
			return false;
		}	
	};	
	// If the screen is wider than it is tall, make the chart dive 70% wide; otherwise, make it 100% wide!
	$scope.chartAndTableWidth = function () {
		if (window.innerWidth > window.innerHeight) {
			return '72%';
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
			
			// Check if this a gas-sensing Phidget
			if ( ($stateParams.assetName).indexOf("Gas") != -1) {
				imageSource = 'Phidget2';
			}
		}		
		return imageSource;
	};

    // The interval timer gets the target AF asset and calls the dataservice to send live data from this device's sensors to the PI System
    $scope.sendDatatoPI = function () {
		// Only do this, though, if the current element is asset 1 through 5! Otherwise, don't send data!
		if ( ($stateParams.assetName).substring(0,6) == "Asset ") {
			// NEW! Check to see if the target asset name does NOT contain "Read Only"
			if ($stateParams.assetName.toLowerCase().indexOf("read only") == -1) {
				console.log("Current AF Element is a phone-based element; will start streaming data!");
				// Get the attributes that will be written to
				dataService.getElementAttributes(afTemplate, dataService.getTargetAssetElementName($stateParams.assetName)).then(function (attributes) {
					performRepetitiveActionsForTheseAFAttributes(attributes);
				});
			} else {
				console.log("Read-only asset detected!  Data will not be written; data will only be read from the PI System.");
				$("#readOnlyModal").modal();
			}
		} else {
			console.log("Current AF Element does not use a phone-based data source; device sensor data will not be streamed.");
		}
    };
	
	// Repetitive function!  Contains behavior for getting data and acting on it
	function performRepetitiveActionsForTheseAFAttributes(attributes) {
		if (attributes) {
			dataService.sendDatatoPIAttributes(attributes);
		}
		// Call this function again after a certain time range
		stop = setTimeout( function() {
			performRepetitiveActionsForTheseAFAttributes(attributes)
		}, DATA_REFRESH_INTERVAL_IN_MILLISECONDS);		
	}

}]);
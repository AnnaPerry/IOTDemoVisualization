'use strict';
app.controller('chartAndTableWrapperController', ['$scope', '$stateParams', 'dataService', 'mobileDeviceSensorDataService', function ($scope, $stateParams, dataService, mobileDeviceSensorDataService) {

	// Get all of the buttons that should only be shown when an asset has selected, and set their correct visibility
	var buttonElements = document.getElementsByClassName("showChartBarAndTableButtonsClass");
	for (var i = 0; i < buttonElements.length; i++) {
		//buttonElements[i].style.display = "none";
		buttonElements[i].style.display = "block";
	}
	
    //var afTemplate = 'Phone Sensors Template';
	//var afTemplate = 'Asset Template';
	var afTemplate = DEFAULT_AF_TEMPLATE;
    var afAttributeCategory = 'Phone-based Data';
	var includeAttributeNameInQueryResults = true;
    var stop;	
	var attributesToWriteTo;

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
    };

	// If the screen is wider than it is tall, the image should appear; otherwise, it should not!
	$scope.showImageDiv = function () {
		if (window.innerWidth > window.innerHeight) {
			document.getElementById("dataVisualizationColumn").className = "col-xs-8 fullHeightNoMarginsOrPadding";
			return true;
		} else {
			document.getElementById("dataVisualizationColumn").className = "col-xs-12 fullHeightNoMarginsOrPadding";
			return false;
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
		// Otherwise, just use the asset name!
		else {
			//imageSource = $stateParams.assetName;
			imageSource = $stateParams.assetName;
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
				// Get the attributes that will be written to; pass along the fourth argument as "true" in order to get the attribute names as well
				dataService.getElementAttributes(afTemplate, $stateParams.assetName, afAttributeCategory, includeAttributeNameInQueryResults).then(function (attributes) {					
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
			// Sample data from mobile sensors, and send that data to the PI System!
			mobileDeviceSensorDataService.sendDatatoPIAttributes(attributes);
		}
		// Call this function again after a certain time range
		stop = setTimeout( function() {
			performRepetitiveActionsForTheseAFAttributes(attributes)
		}, SENSOR_SAMPLE_RATE_IN_MILLISECONDS);		
	}

}]);
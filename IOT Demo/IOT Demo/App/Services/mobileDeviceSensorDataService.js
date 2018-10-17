'use strict';
angular.module('iotdemoApp')
.service('mobileDeviceSensorDataService', ['$http', function ($http) {
	
	// Constant for turning on or off sending data to the PI System
	var SEND_DATA_TO_PI_SYSTEM = true;

	// Global vars to hold the current acceleration and orientation and etc.
	var currentxAccelerationReading;                // In meters per second squared
	var currentyAccelerationReading;                // In meters per second squared
	var currentzAccelerationReading;                // In meters per second squared
	var currentAlphaOrientationReading;             // In degrees
	var currentBetaOrientationReading;              // In degrees
	var currentGammaOrientationReading;             // In degrees
	var batteryLevel;                               // A percentage
	var proximityValue;                             // in centimeters
	var ambientLightLevel;                          // in Lux

	// Assume each sensor is supported, but if one isn't, log that!
	var unsupportedBrowserEvents = "";
	var missingSensorTypes = "";

	// Global variable to detect if an incompatible device is used
	var compatibilityModalTriggeredAlready = false;
	
	// Debug enable
	var ENABLE_CONSOLE_OUTPUT = true;

	// ---------------------------------------------------------------------------------------------
	// ---------------------------------------------------------------------------------------------
	// Event-handing functions for reading local sensors

	if (SEND_DATA_TO_PI_SYSTEM) {

		// Set up a handler to track motion
		if (window.DeviceMotionEvent) {
			window.addEventListener('devicemotion', function (event) {
				// Get the current acceleration values in 3 axes (measured in meters per second squared)
				/*
				// Excludes gravity
				currentxAccelerationReading = event.acceleration.x;
				currentyAccelerationReading = event.acceleration.y;
				currentzAccelerationReading = event.acceleration.z;
				*/
				// Below includes gravity, so Z will almost always be equal to 1 G equivalent
				currentxAccelerationReading = event.accelerationIncludingGravity.x;
				currentyAccelerationReading = event.accelerationIncludingGravity.y;
				currentzAccelerationReading = event.accelerationIncludingGravity.z;
				updateSensorValuesDiv();
			}, false);
			logCompatibility("acceleration", false);
		} else {
			unsupportedBrowserEvents += ", x-, y-, and z-acceleration";
			logCompatibility("acceleration", false);
		}

		// Set up a handler to track orientation
		if (window.DeviceOrientationEvent) {
			window.addEventListener('deviceorientation', function (event) {
				// Get the current orientation
				currentAlphaOrientationReading = event.alpha;
				currentBetaOrientationReading = event.beta;
				currentGammaOrientationReading = event.gamma;
				updateSensorValuesDiv();
			}, false);
			logCompatibility("orientation", true);
		} else {
			unsupportedBrowserEvents += ", alpha-, beta-, and gamma-orientation";
			logCompatibility("orientation", false);
		}

		// Also set up handlers for tracking proximity 
		if (window.DeviceProximityEvent) {
			window.addEventListener('deviceproximity', function (event) {
				// If a proximity event is detected, save the new proximity value
				proximityValue = event.value;
				updateSensorValuesDiv();
			});
			logCompatibility("proximity", true);
		} else {
			unsupportedBrowserEvents += ", proximity";			
			logCompatibility("proximity", false);
		}

		// Also set up handlers for tracking light
		if (window.DeviceLightEvent) {
			window.addEventListener('devicelight', function (event) {
				// If a light change event is detected, save the new value
				ambientLightLevel = event.value;
				updateSensorValuesDiv();
			});
			logCompatibility("light", true);
		} else {
			unsupportedBrowserEvents += ", light";			
			logCompatibility("light", false);
		}
	} else {
		if (ENABLE_CONSOLE_OUTPUT) { console.log("Data streaming disabled!");};
	}

	// Helper function that logs the compatibility for each sensor
	function logCompatibility(sensorType, supported) {
		if (supported == true) {
			if (ENABLE_CONSOLE_OUTPUT) { console.log("Event listener added for this type of sensor data: " + sensorType);};
		} else {
			if (ENABLE_CONSOLE_OUTPUT) { console.log("Event listener NOT added for this type of sensor data: " + sensorType);};
		}
	}

	// Helper function that toggles the compatibility alert if a sensor isn't supported
	function displayCompatibilityAlert() {
		// Fire a notification if it hasn't been done yet
		if (!compatibilityModalTriggeredAlready && SEND_DATA_TO_PI_SYSTEM) {
			compatibilityModalTriggeredAlready = true;
			var outputHTML = "";
			// Display an error message for unsupported events and/or missing sensor types
			if (unsupportedBrowserEvents != "") {
				outputHTML += "Your <b>web browser</b> is unable to read data for these sensor types: ";
				// Trim the first comma, then add the unsupported event listeners
				outputHTML += (unsupportedBrowserEvents.substr(2));
				outputHTML += "<br/>"
			}
			if (missingSensorTypes != "") {
				outputHTML += "Your <b>device</b> is unable to generate data for these sensor types: ";
				// Trim the first comma, then add the unsupported sensor types
				outputHTML += (missingSensorTypes.substr(2));
				outputHTML += "<br/>"
			}
			outputHTML += "<br/>Simulated sensor values will be generated for these sensors to mimic a compatible device.";
			document.getElementById("compatibilityCheckModalBodyText").innerHTML = outputHTML;
			$("#compatibilityCheckModal").modal();
		}
	}

	// ---------------------------------------------------------------------------------------------
	// ---------------------------------------------------------------------------------------------

	// Function that takes all of the current sensor values and displays them in a div
	function updateSensorValuesDiv() {
		var outputHTML = "";
		// Combine all sensor readings (stored in global variables) into a single div
		outputHTML = "" + 
			"<b>X Acceleration:</b> " + currentxAccelerationReading + " m/s2<br />" +
			"<b>Y Acceleration</b>: " + currentyAccelerationReading + " m/s2<br />" +
			"<b>Z Acceleration</b>: " + currentzAccelerationReading + " m/s2<br />" +
			 "<br />" +
			"<b>Alpha Orientation</b>: " + currentAlphaOrientationReading + " °<br />" +
			"<b>Beta Orientation</b>: " + currentBetaOrientationReading + " °<br />" +
			"<b>Gamma Orientation</b>: " + currentGammaOrientationReading + " °<br />" +
			"<br />" +
			//"<b>Battery Level</b>: " + batteryLevel + " %<br />" + // Battery is no longer available after recent changes to Firefox!
			"<b>Proximity Value</b>: " + proximityValue + " cm<br />" +
			"<b>Ambient Light Level</b>: " + ambientLightLevel + " lux" + 
			"<br />" +
			"<br />" +
			"<i>(Note: 'undefined' or 'null' signifies that a sensor is not supported by this device and/or browser; simulated data will be generated for such sensors.)</i>";
		// Write this to the div!
		document.getElementById("sensorValuesModalBodyText").innerHTML = outputHTML;
	}
	// Call this function once, just to update the output box at least once
	updateSensorValuesDiv();
	
	//-----------------------------------------------------------------------------------------------------------------------------------
	//-----------------------------------------------------------------------------------------------------------------------------------
	
    // Functions and objects accessible by the service
	var methodsExposedByThisService = {	
		// If the target attributes are already known, directly send data to those attributes!
		sendDatatoPIAttributes: function (attributes) {
			// Only send data if it is explicitly allowed!
			if (SEND_DATA_TO_PI_SYSTEM == true) {
				// Define a global variable to hold all of the new values
				var combinedAttributeValuesJSONObject = [];
				// For each of the attributes in the array of attributes that was passed in
				attributes.forEach(function (attribute) {
					// Based on that attributes name, read the correct sensor on the data source device
					var value;
					switch (attribute.Name) {
						case "X-axis": {
							value = currentxAccelerationReading;
							// If this sensor value isn't defined, generate a simulated value, and log this incompatibility
							if (value == null) {
								value = Math.random() * 10;
								missingSensorTypes += ", x-acceleration";
							}
							break;
						}
						case "Y-axis": {
							value = currentyAccelerationReading;
							// If this sensor value isn't defined, generate a simulated value, and log this incompatibility
							if (value == null) {
								value = Math.random() * 10;
								missingSensorTypes += ", y-acceleration";
							}
							break;
						}
						case "Z-axis": {
							value = currentzAccelerationReading;
							// If this sensor value isn't defined, generate a simulated value, and log this incompatibility
							if (value == null) {
								value = Math.random() * 10;
								missingSensorTypes += ", z-acceleration";
							}
							break;
						}
						case "Alpha spin": {
							value = currentAlphaOrientationReading;
							// If this sensor value isn't defined, generate a simulated value, and log this incompatibility
							if (value == null) {
								value = Math.random() * 90;
								missingSensorTypes += ", alpha-orientation";
							}
							break;
						}
						case "Beta spin": {
							value = currentBetaOrientationReading;
							// If this sensor value isn't defined, generate a simulated value, and log this incompatibility
							if (value == null) {
								value = Math.random() * 90;
								missingSensorTypes += ", beta-orientation";
							}
							break;
						}
						case "Gamma spin": {
							value = currentGammaOrientationReading;
							// If this sensor value isn't defined, generate a simulated value, and log this incompatibility
							if (value == null) {
								value = Math.random() * 90;
								missingSensorTypes += ", gamma-orientation";
							}
							break;
						}
						case "Light": {
							value = ambientLightLevel;
							// If this sensor value isn't defined, generate a simulated value, and log this incompatibility
							if (!window.DeviceLightEvent || value == null) {
								value = Math.random() * 20;
								missingSensorTypes += ", light";
							}
							break;
						}
						case "Proximity": {
							value = proximityValue;
							// If this sensor value isn't defined, generate a simulated value, and log this incompatibility
							if (!window.DeviceProximityEvent || value == null) {
								value = Math.random() * 10;
								missingSensorTypes += ", proximity";
							}
							break;
						}
						default: {
							value = 0;
							break;
						}
					}
					// Last-ditch error handler
					if (value == null) {
						value = 0;
					}
					// Add this new data value as a JSON object to the array of value objects that will be written (at the current time)
					combinedAttributeValuesJSONObject.push(
						{
							'WebId': attribute.WebId,
							'Value': { 
								'Timestamp': "*",
								'Value': value
							}
						}
					);
				});
				// Assemble the PI WEB API URL for writing these new values
				var url = _httpsPIWebAPIUrl + "/streamsets/value";
				// Send these new values to be written to the PI System
				$http.post(url, JSON.stringify(combinedAttributeValuesJSONObject), {'Content-Type': 'application/json', 'Timeout': WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000});
				// Check if an incompatibility was detected; if so, trigger the alert!
				if ((unsupportedBrowserEvents !== "") || (missingSensorTypes != "")) {
					displayCompatibilityAlert();
				}
			}
		}
	};
   return methodsExposedByThisService;
}]);

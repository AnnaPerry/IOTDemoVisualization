'use strict';
angular.module('iotdemoApp')
.service('dataService', ['$http', '$q', '$interval', '$window', function ($http, $q, $interval, $window) {

    // Define a timeout for web requests
    var WEB_REQUEST_MAX_TIMEOUT_SECONDS = 20;
    
    // Below is the PI Web API endpoint URL
    var _httpsPIWebAPIUrl = "";

    // Get the gateway name from the URL: everything after the first "//", before the first ":", before the first "/", and trim any "/" remaining
    var HOST_NAME_FROM_URL = window.location.href
        .replace("http://", "")
        .replace("https://", "")
        .split(":", 1)[0]
        .split("/")[0]
        .replace("/", "");

    // Computed PI Web API Base URL
    //HOST_NAME_FROM_URL = "pi4egdemo7"; // Hard-coded; used for testing only!
    var _httpsPIWebAPIUrl_fromURL = "https://" + HOST_NAME_FROM_URL + "/piwebapi/";
    // Automatically try to add in the URL if it was left blank
    if (_httpsPIWebAPIUrl == "") {
        _httpsPIWebAPIUrl = _httpsPIWebAPIUrl_fromURL;
    }

    // Constants for connecting to and querying the target AF database and AF server
    var _afserver = 'localhost';
    var _afdb = 'Asset Framework DB 1'; // The default is 'Asset Framework DB 1'; try changing this to 'DB 2' for phase 2!
    var _afdbwebid = '';
    var _startTime = '*-2m';
    var _endTime = '*';
	var _interval = '1s';

    // Constant for turning on or off sending data to the PI System
    var SEND_DATA_TO_PI_SYSTEM = true;
     
    
    // Global variable to detect if an incompatible device is used
    var modalTriggeredAlready = false;

    // GLobal vars to hold the current acceleration and orientation and etc.
    var currentxAccelerationReading;                // In meters per second squared
    var currentyAccelerationReading;                // In meters per second squared
    var currentzAccelerationReading;                // In meters per second squared
    var currentAlphaOrientationReading;             // In degrees
    var currentBetaOrientationReading;              // In degrees
    var currentGammaOrientationReading;             // In degrees
    var batteryLevel;                               // A percentage
    var proximityValue;                             // in centimenters
    var ambientLightLevel;                          // in lux

    // Actually writes data for a certain group of attributes
    function sendCurrentReadings(attributes) {
		// Assume each sensor is supported, but if one isn't, log that!
		var incompatibleSensors = "";
		
        // Define global variable to hold all of the new values
        var dataObj = [];

        // For each of the attributes in the array of attributes that was passed in
        attributes.forEach(function (attribute) {

            // Based on that attributes name, read the correct sensor on the data source device
            var value;
            switch (attribute.Name) {
                case "X-axis acceleration": {
                    value = currentxAccelerationReading;
					// If this sensor value isn't defined, generate a simulated value, and log this incompatibility
                    if (value == null) {
                        value = Math.random() * 10;
						incompatibleSensors += ", x-acceleration";
                    }
                    break;
                }
                case "Y-axis acceleration": {
                    value = currentyAccelerationReading;
					// If this sensor value isn't defined, generate a simulated value, and log this incompatibility
                    if (value == null) {
                        value = Math.random() * 10;
						incompatibleSensors += ", y-acceleration";
                    }
                    break;
                }
                case "Z-axis acceleration": {
                    value = currentzAccelerationReading;
					// If this sensor value isn't defined, generate a simulated value, and log this incompatibility
                    if (value == null) {
                        value = Math.random() * 10;
						incompatibleSensors += ", z-acceleration";
                    }
                    break;
                }
                case "Alpha-axis rotation": {
                    value = currentAlphaOrientationReading;
					// If this sensor value isn't defined, generate a simulated value, and log this incompatibility
                    if (value == null) {
                        value = Math.random() * 90;
						incompatibleSensors += ", alpha-orientation";
                    }
                    break;
                }
                case "Beta-axis rotation": {
                    value = currentBetaOrientationReading;
					// If this sensor value isn't defined, generate a simulated value, and log this incompatibility
                    if (value == null) {
                        value = Math.random() * 90;
						incompatibleSensors += ", beta-orientation";
                    }
                    break;
                }
                case "Gamma-axis rotation": {
                    value = currentGammaOrientationReading;
					// If this sensor value isn't defined, generate a simulated value, and log this incompatibility
                    if (value == null) {
                        value = Math.random() * 90;
						incompatibleSensors += ", gamma-orientation";
                    }
                    break;
                }
                case "Ambient light level": {
                    value = ambientLightLevel;
                    // If this sensor value isn't defined, generate a simulated value, and log this incompatibility
                    if (!window.DeviceLightEvent || value == null) {
                        value = Math.random() * 100;
						incompatibleSensors += ", light";
                    }
                    break;
                }
                case "Proximity sensor reading": {
                    value = proximityValue;
                    // If this sensor value isn't defined, generate a simulated value, and log this incompatibility
                    if (!window.DeviceProximityEvent || value == null) {
                        value = Math.random() * 50;
						incompatibleSensors += ", proximity";
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
            // Add this new data value as an object to the array of value objects that will be written (at the current time)
            dataObj.push({ 'WebId': attribute.WebId, 'Value': { 'Timestamp': "*", 'Value': value } });
        });
        // Assemble the URL for writing these new values
        var url = _httpsPIWebAPIUrl + "/streamsets/value";
        // Send these new values to be written to the PI System
        $http.post(url, JSON.stringify(dataObj), {'Content-Type': 'application/json', 'Timeout': WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000});

		// Check if an incompatibility was detected; if so, trigger the alert!
		if (incompatibleSensors !== "") {
			displayCompatibilityAlert(incompatibleSensors);
		}
    };

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
            logCompatibility("light", false);
        }
    } else {
		console.log("Data streaming disabled!");
	}

    // Helper function that logs the compatibility for each sensor
    function logCompatibility(sensorType, supported) {
		if (supported == true) {
			console.log("Event listener added for this type of sensor data: " + sensorType);
		} else {
			console.log("Event listener NOT added for this type of sensor data: " + sensorType);
		}
	}
	
	// Helper function that toggles the compatibility alert if a sensor isn't supported
	function displayCompatibilityAlert(incompatibleSensors) {
        // Fire a notification if it hasn't been done yet
        if (!modalTriggeredAlready && SEND_DATA_TO_PI_SYSTEM) {
            modalTriggeredAlready = true;
			var outputHTML = "Your device and/or browser does not support reading the following sensor types:<br/>";
			// Trim the first comma
			outputHTML += (incompatibleSensors.substr(2));
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
        // Combine all sensor readings into a single div
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

    // ---------------------------------------------------------------------------------------------
    // ---------------------------------------------------------------------------------------------
    // Functions for interacting with the PI Web API to read and write data

	// Fired when an http request returns an error!
	function respondToHTTPRequestError(response, attemptedTask) {
		// Hide the loading spinner
		//document.getElementById("loadingSpinner").style.visibility = "hidden"; 
		document.getElementById("loadingSpinnerIcon").className = "fa fa-refresh fa-fw"; 
		// Set the modal body text to the error
		console.log(response);
		document.getElementById("errorMessageModalBodyText").innerHTML = "Error when " + attemptedTask + ".<br/><br/>" + response.data + "<br />" + "Plese try refreshing this app. If this error reappears, please verify that the PI Web API Service is running, that the PI System is running, and that the target AF object exists.  If this error persists, please try restarting the PI Web API service.";
		// Open the modal, but only if it's not already open!
		if (!$('#errorMessageModal').is(':visible')) {
			$("#errorMessageModal").modal();
		} else {
			console.log("Tried to open error modal, but it is already open.");
		}
	}
	
    // Returns the webId of a particular AF database, based on the hard-coded AF database name
    function getafdb() {
		var selectedFieldsParameters = "&selectedFields=WebId";
        var url = _httpsPIWebAPIUrl + 'assetdatabases?path=\\\\' + _afserver + '\\' + _afdb + selectedFieldsParameters;
        return $http.get(url, {timeout: WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000}).then(function (response) {
            return response.data.WebId;
        }, function (response) {respondToHTTPRequestError(response, "first getting the target AF DB web ID")});
    };

    // Returns a properly formatted query URL for asking for AF attributes within a particular database,
    // belonging to Elements with a certain name, template, and (if provided) a certain attribute category
    function buildElementAttributesUrl(elementTemplate, elementNameFilter, attributeCategory) {
		// By default, return just the Web Id
		var selectedFieldsParameters = '&selectedFields=Items.WebId';
		// Start with the base query URL, which always includes the AF DB web ID and the element name
		var url = _httpsPIWebAPIUrl + 'assetdatabases/' + _afdbwebid + '/elementattributes?searchFullHierarchy=true' + '&elementNameFilter=' + elementNameFilter;
		// If the element template is included, append that as well
		if (elementTemplate && (elementTemplate != '')) {
			url = url + '&elementTemplate=' + elementTemplate;
		}
		// If the attribute category is included, append that as well
		if (attributeCategory) {
			url = url + '&attributeCategory=' + attributeCategory;		
		} else {
			// If there is no category, then you must be writing to the PI System, in which case, you need both the attribute name and WebId too!
			selectedFieldsParameters = selectedFieldsParameters + ';Items.Name';
		}
		// Add the selected fields parameters
		url = url + selectedFieldsParameters;
		return url;
    };

    // Returns a properly formatted multi-attribute URL given a URL prefix and a collection of additional attributes
    function constructUrl(url, attributes) {
        attributes.forEach(function (attribute) { url += 'webid=' + attribute.WebId + '&' });
        url = url.slice(0, -1);
        return url;
    };

	// Variable to for tracking if a page has loaded before
	var isFirstTimeThisPageHasLoadedFlag = true;
	
    // Functions and objects accessible by the service
    return {
        enablePhoneBasedDataCollectionFeatures: function () {
            return ( SEND_DATA_TO_PI_SYSTEM );
        },
		// Tracks how often any given page loads
		isFirstTimeThisPageHasLoaded: function () {
            if (isFirstTimeThisPageHasLoadedFlag == true) {
				isFirstTimeThisPageHasLoadedFlag = false; 
				return true;
			} else {
				return false;
			}				
        },
        // Get an array of elements within an AF database that match a particular element template
        getElements: function (elementTemplate) {
			var selectedFieldsParameters = '&selectedFields=Items.Name;Items.Description';
            if (_afdbwebid) {
                var url = _httpsPIWebAPIUrl + 'assetdatabases/' + _afdbwebid + '/elements?searchFullHierarchy=true&templateName=' + elementTemplate  + selectedFieldsParameters;
                return $http.get(url, {timeout: WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000}).then(function (response) { 
					return response.data.Items;
					}, function (response) {respondToHTTPRequestError(response, "getting elements that match the desired template")});
            }
            else {
                // If the AF database webId isn't availalbe yet, ask for the web ID of the database, and next launch the query
                return getafdb().then(function (webid) {
                    _afdbwebid = webid;
                    var url = _httpsPIWebAPIUrl + 'assetdatabases/' + _afdbwebid + '/elements?searchFullHierarchy=true&templateName=' + elementTemplate  + selectedFieldsParameters;
                    return $http.get(url, {timeout: WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000}).then(function (response) { 
						return response.data.Items;
					}, function (response) {respondToHTTPRequestError(response, "getting elements that match the desired template")});
                });
            }
        },
        // Get an array of element attributes
        getElementAttributes: function (elementTemplate, elementNameFilter, attributeCategory) {
            if (_afdbwebid) {
                var url = buildElementAttributesUrl(elementTemplate, elementNameFilter, attributeCategory);
                return $http.get(url, {timeout: WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000}).then(function (response) {
                    return response.data.Items;
                }, function (response) {respondToHTTPRequestError(response, "getting element attribute web IDs")});
            } else {
                // If the AF database webId isn't availalbe yet, ask for the web ID of the database, and next launch the query
                return getafdb().then(function (webid) {
                    _afdbwebid = webid;
                    var url = buildElementAttributesUrl(elementTemplate, elementNameFilter, attributeCategory);
                    return $http.get(url, {timeout: WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000}).then(function (response) {
                        return response.data.Items;
                    }, function (response) {respondToHTTPRequestError(response, "getting element attribute web IDs")});
                });
            }
        },
        // Return an array of snapshot values, based on an array of attributes to query
        getSnapshots: function (attributes) {
			var selectedFieldsParameters = '?selectedFields=Items.Name;Items.Value.Value;Items.Value.UnitsAbbreviation';
            var url = constructUrl(_httpsPIWebAPIUrl + '/streamsets/value' + selectedFieldsParameters + '&', attributes);
            return $http.get(url, {timeout: WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000}).then(function (response) {
                return response;
            }, function (response) {respondToHTTPRequestError(response, "requesting snapshot data")});               
        },
        // Return an array of arrays of interpolated values for a certain array of attributes
        getInterpolatedValues : function (attributes) {
			var selectedFieldsParameters = '?selectedFields=Items.Name;Items.Items.Value;Items.Items.Timestamp;Items.Items.UnitsAbbreviation';
            var url = constructUrl(_httpsPIWebAPIUrl + '/streamsets/interpolated' + selectedFieldsParameters + '&startTime=' + _startTime + '&endTime=' + _endTime + '&interval=' + _interval + '&', attributes);
            return $http.get(url, {timeout: WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000}).then(function (response) {
                return response;
            }, function (response) {respondToHTTPRequestError(response, "requesting interpolated data")});       
        },		
        // Returns the correct string for the name of the AF asset, including the asset number
        getTargetAssetElementName: function (assetName) {
			// NEW! Replace the read-only suffix if it exists
			var cleanedAssetName = assetName.replace(" (Read only)","");
            var assetidNumber = cleanedAssetName.match(/[0-9]+/i)[0];
            // All of the target assets start with "Phone" and end with "Sensors"; insert in the middle the asset id #
            return 'Phone ' + assetidNumber + ' Sensors';

        },
		/*
		// Depracated!
        // Given a target element template and element name, get its attributes, and next send values to those attributes
        sendDatatoPI: function (elementTemplate, targetAssetName) {
            // Only send data if it is explicitly allowed!
            if (SEND_DATA_TO_PI_SYSTEM == true) {
                this.getElementAttributes(elementTemplate, targetAssetName).then(function (attributes) {
                    sendCurrentReadings(attributes);
                });
            }
        },
		*/
		// If the target attributes are already known, directly send data to those attributes!
		sendDatatoPIAttributes: function (attributes) {
            // Only send data if it is explicitly allowed!
            if (SEND_DATA_TO_PI_SYSTEM == true) {
                sendCurrentReadings(attributes);
            }
        }
   };
}]);
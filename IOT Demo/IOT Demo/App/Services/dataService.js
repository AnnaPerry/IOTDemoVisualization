'use strict';
angular.module('iotdemoApp')
.service('dataService', ['$http', '$q', '$window', function ($http, $q, $window) {

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
	
	// Cache variables used to remember the results of recent queries
	var _cachedElements;
	var _cachedElementAttributes_timeSeriesCaterory;
	var _cachedElementAttributes_snapshotCategory;
	var _cachedElementAttributes_TopLevelKPISAsset;
	var _cachedElementNameFilter;
	var _cachedElementTemplate;

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

	// Assume each sensor is supported, but if one isn't, log that!
	var unsupportedBrowserEvents = "";
	var missingSensorTypes = "";
		
    // Actually writes data for a certain group of attributes
    function sendCurrentReadings(attributes) {

        // Define global variable to hold all of the new values
        var dataObj = [];

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
            // Add this new data value as an object to the array of value objects that will be written (at the current time)
            dataObj.push({ 'WebId': attribute.WebId, 'Value': { 'Timestamp': "*", 'Value': value } });
        });
        // Assemble the URL for writing these new values
        var url = _httpsPIWebAPIUrl + "/streamsets/value";
        // Send these new values to be written to the PI System
        $http.post(url, JSON.stringify(dataObj), {'Content-Type': 'application/json', 'Timeout': WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000});

		// Check if an incompatibility was detected; if so, trigger the alert!
		if ((unsupportedBrowserEvents !== "") || (missingSensorTypes != "")) {
			displayCompatibilityAlert();
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
	function displayCompatibilityAlert() {
        // Fire a notification if it hasn't been done yet
        if (!modalTriggeredAlready && SEND_DATA_TO_PI_SYSTEM) {
            modalTriggeredAlready = true;
			var outputHTML = "";
			
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
		document.getElementById("loadingSpinnerIcon").className = "fa fa-refresh fa-fw"; 
		// Set the modal body text to the error
		//console.log(response);
		var newModalText = "Error when " + attemptedTask + ".<br/>";
		if (response.data && response.data.Errors) {
			newModalText += "Error code " + response.status + ": " + response.data.Errors[0] + "<br/>";
		} else if (response.data) {
			newModalText += response.data;
		}
		// Append some instructions
		newModalText += "<br />Plese try refreshing this app. If this error reappears, please verify that the PI Web API Service is running, that the PI System is running, and that the target AF object exists.  If this error persists, please try restarting the PI Web API service.";
		// Write this text to the modal
		document.getElementById("errorMessageModalBodyText").innerHTML = newModalText;
		// Open the modal, but only if it's not already open!
		if (!$('#errorMessageModal').is(':visible')) {
			$("#errorMessageModal").modal();
		} else {
			console.log("Tried to open error modal, but it is already open.");
		}
	}
	
    // Returns the webId of a particular AF database, based on the hard-coded AF database name
    function getafdb() {
		if (_afdbwebid) {
			console.log("AF DB webId already cached; passing along stored value and continuing...");
			return _afdbwebid;
		} else {
			var selectedFieldsParameters = "&selectedFields=WebId";
			var url = _httpsPIWebAPIUrl + 'assetdatabases?path=\\\\' + _afserver + '\\' + _afdb + selectedFieldsParameters;
			return $http.get(url, {timeout: WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000}).then(
				// If success!
				function (response) {
					_afdbwebid = response.data.WebId;
					return response.data.WebId;
				}, 
				// If failure...
				function (response) {
					respondToHTTPRequestError(response, "first getting the target AF DB web ID");
					return null;
				}
			);
		}
    };

    // Returns a properly formatted query URL for asking for AF attributes within a particular database,
    // belonging to Elements with a certain name, template, and (if provided) a certain attribute category
    function buildElementAttributesUrl(elementTemplate, elementNameFilter, attributeCategory, includeAttributeNameInQueryResults) {
		// By default, return just the Web Id
		var selectedFieldsParameters = '&selectedFields=Items.WebId';
		// Return the attribute name too, if desired
		if (includeAttributeNameInQueryResults) {
			selectedFieldsParameters += ';Items.Name';
		}
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
			//selectedFieldsParameters = selectedFieldsParameters + ';Items.Name';
		}
		// Add the selected fields parameters
		url = url + selectedFieldsParameters;
		return url;
    };

    // Returns a properly formatted multi-attribute URL given a URL prefix and a collection of additional attributes
    function constructUrl(url, attributes) {
		try {
			attributes.forEach(function (attribute) { url += 'webid=' + attribute.WebId + '&' });
		} catch (err) {
			console.log("An error ocurred while appending attribute WebIds to URL: " + err.message);
		}
        url = url.slice(0, -1);
        return url;
    };

	// Variable to for tracking if a page has loaded before
	var isFirstTimeThisPageHasLoadedFlag = true;
	
	//-----------------------------------------------------------------------------------------------------------------------------------
	//-----------------------------------------------------------------------------------------------------------------------------------
	
    // Functions and objects accessible by the service
	var methodsExposedByThisService = {
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
			// If the elements have already been found, return the cached list!
			if (_cachedElements != null) {
				console.log("Using cached elements list...");
				// Convert the cached variable into a promise, and return it
				var deferred = $q.defer();
				deferred.resolve(_cachedElements);
				return deferred.promise;
			} else { 
				if (_afdbwebid) {
					console.log("Using cached AF DB webID; now querying for elements...");
					var selectedFieldsParameters = '&selectedFields=Items.Name;Items.Description';//;Items.WebId';
					var url = _httpsPIWebAPIUrl + 'assetdatabases/' + _afdbwebid + '/elements?searchFullHierarchy=true&templateName=' + elementTemplate  + selectedFieldsParameters;
					return $http.get(url, {timeout: WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000}).then(
						// If success!
						function (response) { 
							// Save the element list!
							_cachedElements = response.data.Items;
							return response.data.Items;
						}, 
						// If failure...
						function (response) {
							respondToHTTPRequestError(response, "getting elements that match the desired template");
							return [];
						}
					);
				} else {
					// If the AF database webId isn't availalbe yet, ask for the web ID of the database, and next launch the query
					return getafdb().then(function (webid) {
						_afdbwebid = webid;
						if (_afdbwebid) {
							var selectedFieldsParameters = '&selectedFields=Items.Name;Items.Description';//;Items.WebId';
							var url = _httpsPIWebAPIUrl + 'assetdatabases/' + _afdbwebid + '/elements?searchFullHierarchy=true&templateName=' + elementTemplate  + selectedFieldsParameters;
							return $http.get(url, {timeout: WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000}).then(
								// If success!
								function (response) { 
									// Save the element list!
									_cachedElements = response.data.Items;
									return response.data.Items;
								}, 
								// If failure...
								function (response) {
									respondToHTTPRequestError(response, "getting elements that match the desired template");
									return [];
								}
							);
						} else {
							console.log("Unable to get elements; AFDB WebID is null!!");
							//respondToHTTPRequestError("", "looking up elements: AF DBV WebID is null");
							return [];
						}
					});
				}
			}
        },
        // Get an array of element attributes
        getElementAttributes: function (elementTemplate, elementNameFilter, attributeCategory, includeAttributeNameInQueryResults) {
			// Check if this a request for attributes for the top-level element, and if that element has already been queried
			if ((_cachedElementAttributes_TopLevelKPISAsset != null) && (attributeCategory == 'KPIs and Rollups')) {
				console.log("Using cached '" + attributeCategory + "' attributes for element '" + elementNameFilter + "'...");
				// Convert the cached variable into a promise, and return it
				var deferred = $q.defer();
				deferred.resolve(_cachedElementAttributes_TopLevelKPISAsset);
				return deferred.promise;

			// Check if the element is the same! Then see if the attributes have been saved and if so, return the corresponding cached attributes
			} else if ((elementTemplate == _cachedElementTemplate) && (elementNameFilter == _cachedElementNameFilter) && (_cachedElementAttributes_timeSeriesCaterory != null) && (attributeCategory == 'Timeseries')) {
				console.log("Using cached '" + attributeCategory + "' attributes for element '" + elementNameFilter + "'...");
				// Convert the cached variable into a promise, and return it
				var deferred = $q.defer();
				deferred.resolve(_cachedElementAttributes_timeSeriesCaterory);
				return deferred.promise;	
			
			// Check if the element is the same! Then see if the attributes have been saved and if so, return the corresponding cached attributes
			} else if ((elementTemplate == _cachedElementTemplate) && (elementNameFilter == _cachedElementNameFilter) && (_cachedElementAttributes_snapshotCategory != null) && (attributeCategory == 'Snapshot') ) {
				console.log("Using cached '" + attributeCategory + "' attributes for element '" + elementNameFilter + "'...");
				// Convert the cached variable into a promise, and return it
				var deferred = $q.defer();
				deferred.resolve(_cachedElementAttributes_snapshotCategory);
				return deferred.promise;	
			
			// At this point, the element name matced, but either the cached attributes were null or the attribute category didn't match
			} else {
				// If the web ID exists, use it to send a query
				if (_afdbwebid) {
					console.log("Using cached AF DB webID; now querying for '" + attributeCategory + "' attributes for element '" + elementNameFilter + "'...");
					var url = buildElementAttributesUrl(elementTemplate, elementNameFilter, attributeCategory, includeAttributeNameInQueryResults);
					return $http.get(url, {timeout: WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000}).then(
						// If success!
						function (response) {
							// Save the attributes and element name filter for future reference!
							if (attributeCategory == 'KPIs and Rollups') {
								console.log("Caching '" + attributeCategory + "' attributes for element '" + elementNameFilter + "'.");
								_cachedElementAttributes_TopLevelKPISAsset = response.data.Items;
							} else {
								// Depending on if it's a time series or snapshot query, save that in the appropriate global var
								if (attributeCategory == 'Timeseries') {
									console.log("Caching '" + attributeCategory + "' attributes for element '" + elementNameFilter + "'.");
									_cachedElementNameFilter = elementNameFilter;
									_cachedElementAttributes_timeSeriesCaterory = response.data.Items;
									_cachedElementTemplate = elementTemplate;
								} else if (attributeCategory == 'Snapshot') {
									console.log("Caching '" + attributeCategory + "' attributes for element '" + elementNameFilter + "'.");
									_cachedElementNameFilter = elementNameFilter;
									_cachedElementAttributes_snapshotCategory = response.data.Items;
									_cachedElementTemplate = elementTemplate;
								}
							}
							return response.data.Items;
						}, 
						// If failure...
						function (response) {
							return null;
							respondToHTTPRequestError(response, "getting element attribute web IDs");
						}
					);
				} else {
					// If the AF database webId isn't available yet, ask for the web ID of the database, and next launch the query
					console.log("AF DB WebID has not yet been found; now asking for AF DB WebId...");
					return getafdb().then(function (webid) {
						_afdbwebid = webid;
						console.log("AF DB WebID found: " + _afdbwebid);
						if (_afdbwebid) {
							var url = buildElementAttributesUrl(elementTemplate, elementNameFilter, attributeCategory, includeAttributeNameInQueryResults);
							return $http.get(url, {timeout: WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000}).then(
								// If success!
								function (response) {
									//console.log(attributeCategory, elementNameFilter, includeAttributeNameInQueryResults);
									// Save the attributes and element name filter for future reference!
									if (attributeCategory == 'KPIs and Rollups') {
										console.log("Caching '" + attributeCategory + "' attributes for element '" + elementNameFilter + "'.");
										_cachedElementAttributes_TopLevelKPISAsset = response.data.Items;
									} else {
										// Depending on if it's a time series or snapshot query, save that in the appropriate global var
										if (attributeCategory == 'Timeseries') {
											console.log("Caching '" + attributeCategory + "' attributes for element '" + elementNameFilter + "'.");
											_cachedElementNameFilter = elementNameFilter;
											_cachedElementAttributes_timeSeriesCaterory = response.data.Items;
											_cachedElementTemplate = elementTemplate;
										} else if (attributeCategory == 'Snapshot') {
											console.log("Caching '" + attributeCategory + "' attributes for element '" + elementNameFilter + "'.");
											_cachedElementNameFilter = elementNameFilter;
											_cachedElementAttributes_snapshotCategory = response.data.Items;
											_cachedElementTemplate = elementTemplate;
										}
									}
									return response.data.Items;
								}, 
								// If failure...
								function (response) {
									respondToHTTPRequestError(response, "getting element attribute web IDs");
									return null;
								}
							);
						} else {
							console.log("Error looking up Web Id for AF DB!");
							//respondToHTTPRequestError("", "looking up Web Id for AF DB!");
							return null;
						}
					});
				}
			}
        },
        // Return an array of snapshot values, based on an array of attributes to query
        getSnapshots: function (attributes) {
			if (attributes) {
				var selectedFieldsParameters = '?selectedFields=Items.Name;Items.Value.Value;Items.Value.UnitsAbbreviation';
				var url = constructUrl(_httpsPIWebAPIUrl + '/streamsets/value' + selectedFieldsParameters + '&', attributes);
				return $http.get(url, {timeout: WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000}).then(
					// If success!
					function (response) {
						return response;
					}, 
					// If failure...
					function (response) {
						respondToHTTPRequestError(response, "requesting snapshot data");
						return [];
					}
				);  
			} else {
				console.log("Error getting snapshots: attribute webIDs are null!");
				//respondToHTTPRequestError("", "getting snapshot values: attribute webIDs are null");
				return [];
			}			
        },
        // Return an array of arrays of interpolated values for a certain array of attributes
        getInterpolatedValues : function (attributes, interval_seconds, duration_minutes) {
			if (attributes) {
				var selectedFieldsParameters = '?selectedFields=Items.Name;Items.Items.Value;Items.Items.Timestamp;Items.Items.UnitsAbbreviation';
				var url = constructUrl(_httpsPIWebAPIUrl + '/streamsets/interpolated' + selectedFieldsParameters + '&startTime=' + "*-" + duration_minutes + "m" + '&endTime=' + _endTime + '&interval=' + interval_seconds + "s" + '&', attributes);
				return $http.get(url, {timeout: WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000}).then(
					// If success!
					function (response) {
						return response;
					}, 
					// If failure...
					function (response) {
						respondToHTTPRequestError(response, "requesting interpolated data");
						return [];
					}
				);   
			} else {
				console.log("Error getting interpolated values: attribute webIDs are null!");
				//respondToHTTPRequestError("", "getting interpolated values: attribute webIDs are null");
				return [];
			}				
        },		
		// If the target attributes are already known, directly send data to those attributes!
		sendDatatoPIAttributes: function (attributes) {
            // Only send data if it is explicitly allowed!
            if (SEND_DATA_TO_PI_SYSTEM == true) {
                sendCurrentReadings(attributes);
            }
        }
   };
   return methodsExposedByThisService;
}]);
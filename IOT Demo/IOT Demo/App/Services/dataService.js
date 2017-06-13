'use strict';
angular.module('iotdemoApp')
.service('dataService', ['$http', '$q', '$interval', '$window', function ($http, $q, $interval, $window) {

    
    
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
    var _startTime = '*-10m';
    var _endTime = '*';

    // Constant for turning on or off sending data to the PI System
    var SEND_DATA_TO_PI_SYSTEM = true;
    // If the target AF database is something other than the default, turn off sending data!
    if (_afdb != 'Asset Framework DB 1') {
        SEND_DATA_TO_PI_SYSTEM = false;
    }

    
    
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
        // Define global variable to hold all of the new values
        var dataObj = [];

        // Read the current battery level, then
        //$window.navigator.getBattery().then(function (battery) {

        // For each of the attributes in the array of attributes that was passed in
        attributes.forEach(function (attribute) {

            // Based on that attributes name, read the correct sensor on the data source device
            var value;
            switch (attribute.Name) {
                case "Bearing oil health": { // Actually the battery level!
                    value = batteryLevel;
                    if (value == null) {
                        value = 95;
                    }
                    break;
                }
                case "X-axis acceleration": {
                    value = currentxAccelerationReading;
                    if (value == null) {
                        value = Math.random() * 10;
                    }
                    break;
                }
                case "Y-axis acceleration": {
                    value = currentyAccelerationReading;
                    if (value == null) {
                        value = Math.random() * 10;
                    }
                    break;
                }
                case "Z-axis acceleration": {
                    value = currentzAccelerationReading;
                    if (value == null) {
                        value = Math.random() * 10;
                    }
                    break;
                }
                case "Alpha-axis rotation": {
                    value = currentAlphaOrientationReading;
                    if (value == null) {
                        value = Math.random() * 90;
                    }
                    break;
                }
                case "Beta-axis rotation": {
                    value = currentBetaOrientationReading;
                    if (value == null) {
                        value = Math.random() * 90;
                    }
                    break;
                }
                case "Gamma-axis rotation": {
                    value = currentGammaOrientationReading;
                    if (value == null) {
                        value = Math.random() * 90;
                    }
                    break;
                }
                case "Ambient light level": {
                    value = ambientLightLevel;
                    // If there is no light sensor, generate a random reading
                    if (!window.DeviceLightEvent || value == null) {
                        value = Math.random() * 300;
                    }
                    break;
                }
                case "Proximity sensor reading": {
                    value = proximityValue;
                    // If there is no proximity sensor, generate a random reading
                    if (!window.DeviceProximityEvent || value == null) {
                        value = Math.random() * 50;
                    }
                    break;
                }
                default: {
                    value = 0;
                    break;
                }
            }
			// Last-ditch error handler
			if (value == null)
			{
				value = 0;
			}
            // Add this new data value as an object to the array of value objects that will be written (at the current time)
            dataObj.push({ 'WebId': attribute.WebId, 'Value': { 'Timestamp': "*", 'Value': value } });
        });
        // Assemble the URL for writing these new values
        var url = _httpsPIWebAPIUrl + "/streamsets/value";
        // Send these new values to be written to the PI System
        $http.post(url, JSON.stringify(dataObj), {'Content-Type': 'application/json'});
        //});
    };

    // ---------------------------------------------------------------------------------------------
    // ---------------------------------------------------------------------------------------------
    // Event-handing functions for reading local sensors

    // Define a function to get the battery level
    /*
    function getBattery() {
        return navigator.getBattery().then(function (battery) {
            return 100 * battery.level;
        });
    }
    */
    if (SEND_DATA_TO_PI_SYSTEM) {
        // Set up a handler to track the battery
        try {
            navigator.getBattery().then(function (battery) {
                batteryLevel = 100 * battery.level;
                battery.addEventListener('levelchange', function () {
                    batteryLevel = 100 * this.level;
                    updateSensorValuesDiv();
                });
                console.log("Event listener added for this type of sensor data: " + "battery");
            });
        } catch(err) {
            displayCompatibilityAlert("battery");
        }

        // Set up a handler to track motion
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', function (event) {
                // Get the current acceleration values in 3 axes (measured in meters per second squared)
                currentxAccelerationReading = event.acceleration.x;
                currentyAccelerationReading = event.acceleration.y;
                currentzAccelerationReading = event.acceleration.z;
                updateSensorValuesDiv();
            }, false);
            console.log("Event listener added for this type of sensor data: " + "acceleration");
        } else {
            displayCompatibilityAlert("acceleration");
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
            console.log("Event listener added for this type of sensor data: " + "orientation");
        } else {
            displayCompatibilityAlert("orientation");
        }

        // Also set up handlers for tracking proximity 
        if (window.DeviceProximityEvent) {
            window.addEventListener('deviceproximity', function (event) {
                // If a proximity event is detected, save the new proximity value
                proximityValue = event.value;
                updateSensorValuesDiv();
            });
            console.log("Event listener added for this type of sensor data: " + "proximity");
        } else {
            displayCompatibilityAlert("proximity");
        }

        // Check if the light sensor is supported!
        if (window.DeviceLightEvent) {
            window.addEventListener('devicelight', function (event) {
                // If a light change event is detected, save the new value
                ambientLightLevel = event.value;
                updateSensorValuesDiv();
            });
            console.log("Event listener added for this type of sensor data: " + "light");
        } else {
            displayCompatibilityAlert("light");
        }
    } else {
		console.log("Data streaming disabled!");
	}

    // Helper function that toggles the compatibility alert if a sensor isn't supported
    function displayCompatibilityAlert(sensorType) {
        console.log("Notification: this browser and/or device is unable to generate data for the following sensor type: " + sensorType + "; simulated data will be generated for this sensor.");
        // Fire a notification if it hasn't been done yet
        if (!modalTriggeredAlready && SEND_DATA_TO_PI_SYSTEM) {
            modalTriggeredAlready = true;
            $("#myModal").modal();
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
            "<b>Battery Level</b>: " + batteryLevel + " %<br />" +
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

    // Returns the webId of a particular AF database, based on the hard-coded AF database name
    function getafdb() {
        var url = _httpsPIWebAPIUrl + 'assetdatabases?path=\\\\' + _afserver + '\\' + _afdb;
        return $http.get(url).then(function (response) {
            return response.data.WebId;
        });
    };

    // Returns a properly formatted query URL for asking for AF attributes within a particular database,
    // belonging to Elements with a certain name, template, and (if provided) a certain attribute category
    function buildElementAttributesUrl(elementTemplate, elementNameFilter, attributeCategory) {
        if (elementTemplate && (elementTemplate != '')) {
			if (!attributeCategory) {
				return _httpsPIWebAPIUrl + 'assetdatabases/' + _afdbwebid + '/elementattributes?searchFullHierarchy=true' + '&elementTemplate=' + elementTemplate + '&elementNameFilter=' + elementNameFilter;
			}
			return _httpsPIWebAPIUrl + 'assetdatabases/' + _afdbwebid + '/elementattributes?searchFullHierarchy=true' + '&elementTemplate=' + elementTemplate + '&elementNameFilter=' + elementNameFilter + '&attributeCategory=' + attributeCategory;
		} else {
			if (!attributeCategory) {
				return _httpsPIWebAPIUrl + 'assetdatabases/' + _afdbwebid + '/elementattributes?searchFullHierarchy=true' + '&elementNameFilter=' + elementNameFilter;
			}
			return _httpsPIWebAPIUrl + 'assetdatabases/' + _afdbwebid + '/elementattributes?searchFullHierarchy=true' + '&elementNameFilter=' + elementNameFilter + '&attributeCategory=' + attributeCategory;			
		}
    };

    // Returns a properly formatted multi-attribute URL given a URL prefix and a collection of additional attributes
    function constructUrl(url, attributes) {
        attributes.forEach(function (attribute) { url += 'webid=' + attribute.WebId + '&' });
        url = url.slice(0, -1);
        return url;
    };

    // Functions and objects accessible by the service
    return {
        enablePhoneBasedDataCollectionFeatures: function () {
            return ( SEND_DATA_TO_PI_SYSTEM );
        },
        // Get an array of elements within an AF database that match a particular element template
        getElements: function (elementTemplate) {
            if (_afdbwebid) {
                var url = _httpsPIWebAPIUrl + 'assetdatabases/' + _afdbwebid + '/elements?searchFullHierarchy=true&templateName=' + elementTemplate;
                return $http.get(url).then(function (response) { return response.data.Items });
            }
            else {
                // If the AF database webId isn't availalbe yet, ask for the web ID of the database, then launch the query
                return getafdb().then(function (webid) {
                    _afdbwebid = webid;
                    var url = _httpsPIWebAPIUrl + 'assetdatabases/' + _afdbwebid + '/elements?searchFullHierarchy=true&templateName=' + elementTemplate;
                    return $http.get(url).then(function (response) { return response.data.Items });
                });
            }
        },
        // Get an array of element attributes
        getElementAttributes: function (elementTemplate, elementNameFilter, attributeCategory) {
            if (_afdbwebid) {
                var url = buildElementAttributesUrl(elementTemplate, elementNameFilter, attributeCategory);
                return $http.get(url).then(function (response) {
                    return response.data.Items;
                });
            } else {
                // If the AF database webId isn't availalbe yet, ask for the web ID of the database, then launch the query
                return getafdb().then(function (webid) {
                    _afdbwebid = webid;
                    var url = buildElementAttributesUrl(elementTemplate, elementNameFilter, attributeCategory);
                    return $http.get(url).then(function (response) {
                        return response.data.Items;
                    });
                });
            }
        },
        // Return an array of snapshot values, based on an array of attributes to query
        getSnapshots: function (attributes) {
            var url = constructUrl(_httpsPIWebAPIUrl + '/streamsets/value?', attributes);
            return $http.get(url).then(function (response) {
                return response;
            });                
        },
        // Return an array of arrays of plot values for a certain array of attributes
        getPloValues : function (attributes) {
            var url = constructUrl(_httpsPIWebAPIUrl + '/streamsets/plot?startTime=' + _startTime + '&endTime' + _endTime + '&', attributes);
            return $http.get(url).then(function (response) {
                return response;
            });        
        },
        // Return an array of arrays of interpolated values for a certain array of attributes
        getInterpolatedValues : function (attributes) {
            var url = constructUrl(_httpsPIWebAPIUrl + '/streamsets/interpolated?startTime=' + '*-2m' + '&endTime=' + '*' + '&interval=' + '1s' + '&', attributes);
            return $http.get(url).then(function (response) {
                return response;
            });        
        },		
        // Returns the correct string for the name of the AF asset, including the asset number
        getTargetAssetElementName: function (assetName) {
            var assetidNumber = assetName.match(/[0-9]+/i)[0];
            // All of the target assets start with "Phone" and end with "Sensors"; insert in the middle the asset id #
            return 'Phone ' + assetidNumber + ' Sensors';

        },
        // Given a target element template and element name, get its attributes, then send values to those attributes
        sendDatatoPI: function (elementTemplate, targetAssetName) {
            // Only send data if it is explicitly allowed!
            if (SEND_DATA_TO_PI_SYSTEM == true) {
                this.getElementAttributes(elementTemplate, targetAssetName).then(function (attributes) {
                    sendCurrentReadings(attributes);
                });
            }
        }
   };
}]);
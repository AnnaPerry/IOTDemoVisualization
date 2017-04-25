'use strict';
angular.module('iotdemoApp')
.service('dataService', ['$http', '$q', '$interval', '$window', function ($http, $q, $interval, $window) {

    // Here is where you can hard-code in the "type" of asset that is displayed--for example, phone, pump, etc.
    var CONST_FRIENDLY_ASSET_NAME = "Phone";

    var _httpsPIWebAPIUrl = "https://pi4egdemo1/piwebapi/"; // "https://arcadia.osisoft.int/piwebapi/";
    var _afserver = 'localhost';
    var _afdb = 'Asset Framework DB 1';
    var _afdbwebid = '';
    var _startTime = '*-10m';
    var _endTime = '*';
    
    // Global variable to detect if an incompatible device is used
    var modalTriggeredAlready = false;

    // GLobal vars to hold the current acceleration and orientation and etc.
    var currentXYZAccelerationReadings;
    var currentAlphaBetaGammaOrientationReadings;
    var batteryLevel = 100;
    var proximityValue = 3; // in centimenters
    var ambientLightLevel = 320; // in lux
    //var setPointValue = 50; // The ability to write to a set point has been temporarily removed

    function getafdb() {
        var url = _httpsPIWebAPIUrl + 'assetdatabases?path=\\\\' + _afserver + '\\' + _afdb;
        return $http.get(url).then(function (response) {
            return response.data.WebId;
        });

    };

    function buildElementAttributesUrl(elementTemplate, elementNameFilter, attributeCategory) {
        if (!attributeCategory) return _httpsPIWebAPIUrl + 'assetdatabases/' + _afdbwebid + '/elementattributes?searchFullHierarchy=true' + '&elementTemplate=' + elementTemplate + '&elementNameFilter=' + elementNameFilter;
        return _httpsPIWebAPIUrl + 'assetdatabases/' + _afdbwebid + '/elementattributes?searchFullHierarchy=true' + '&elementTemplate=' + elementTemplate + '&elementNameFilter=' + elementNameFilter + '&attributeCategory=' + attributeCategory;
    };

    function constructUrl(url, attributes) {
        attributes.forEach(function (attribute) { url += 'webid=' + attribute.WebId + '&' });
        url = url.slice(0, -1);
        return url;
    };

    function sendCurrentReadings(attributes) {
        // Define global variables to hold recent sensor readings
        var dataObj = [];
        var timestamp = "*";

        $window.navigator.getBattery().then(function (battery) {
         
            attributes.forEach(function (attribute) {

                var value;
                switch (attribute.Name) {
                    /*
                    case "Set point": {
                        value = setPointValue;
                        break;
                    }
                    */
                    case "Bearing oil health": {
                        value = 100 * battery.level;
                        break;
                    }
                    case "X-axis acceleration": {
                        value = currentXYZAccelerationReadings.x;
                        if (value == null) {
                            value = Math.random();
                        }
                        break;
                    }
                    case "Y-axis acceleration": {
                        value = currentXYZAccelerationReadings.y;
                        if (value == null) {
                            value = Math.random();
                        }
                        break;
                    }
                    case "Z-axis acceleration": {
                        value = currentXYZAccelerationReadings.z;
                        if (value == null) {
                            value = Math.random();
                        }
                        break;
                    }
                    case "Alpha-axis rotation": {
                        value = currentAlphaBetaGammaOrientationReadings.alpha;
                        if (value == null) {
                            value = Math.random() * 90;
                        }
                        break;
                    }
                    case "Beta-axis rotation": {
                        value = currentAlphaBetaGammaOrientationReadings.beta;
                        if (value == null) {
                            value = Math.random() * 90;
                        }
                        break;
                    }
                    case "Gamma-axis rotation": {
                        value = currentAlphaBetaGammaOrientationReadings.gamma;
                        if (value == null) {
                            value = Math.random() * 90;
                        }
                        break;
                    }
                    case "Ambient light level": {

                        value = ambientLightLevel;
                        // If there is no light sensor, generate a random reading
                        if (!window.DeviceLightEvent) {
                            value = Math.random() * 300;
                        }
                        break;
                    }
                    case "Proximity sensor reading": {
                        value = proximityValue;
                        // If there is no proximity sensor, generate a random reading
                        if (!window.DeviceProximityEvent) {
                            value = Math.random() * 50;
                        }
                        break;
                    }
                }
                
                dataObj.push({ 'WebId': attribute.WebId, 'Value': { 'Timestamp': timestamp, 'Value': value } });

            });
            //console.log(dataObj);
            var url = _httpsPIWebAPIUrl + "/streamsets/value";
            $http.post(url, JSON.stringify(dataObj), {'Content-Type': 'application/json'});
        });
    };

    // Define a function to get the battery level
    function getBattery() {
        return navigator.getBattery().then(function (battery) {
            return 100 * battery.level;
        });
    }

    // Set up a handler to track motion
    if ($window.DeviceMotionEvent) {
        $window.addEventListener('devicemotion', function (event) {
            // Get the current acceleration values in 3 axes (measured in meters per second squared)
            currentXYZAccelerationReadings = event.acceleration;
        }, false);
    } else {
        // Generate simulated data
        currentXYZAccelerationReadings = {
            x: Math.random(), 
            y: Math.random(),
            z: Math.random()
        };
        // Fire a notification if it hasn't been done yet
        if (!modalTriggeredAlready) {
            modalTriggeredAlready = true;
            $("#myModal").modal();
        }
    }

    // Set up a handler to track orientation
    if ($window.DeviceOrientationEvent) {
        $window.addEventListener('deviceorientation', function (event) {
            // Get the current orientation
            currentAlphaBetaGammaOrientationReadings = event;
        }, false);
    } else {
        // Generate simulated data
        currentAlphaBetaGammaOrientationReadings = {
            alpha: Math.random() * 90, 
            beta: Math.random() * 90,
            gamma: Math.random() * 90
        };
        // Fire a notification if it hasn't been done yet
        if (!modalTriggeredAlready) {
            modalTriggeredAlready = true;
            $("#myModal").modal();
        }
    }

    // Also set up handlers for tracking proximity and light level
    if ($window.DeviceProximityEvent) {
        $window.addEventListener('deviceproximity', function (event) {
            // If a proximity event is detected, save the new proximity value
            proximityValue = event.value;
        });
    } else {
        // Generate simulated data
        proximityValue = Math.random() * 50;
        // Fire a notification if it hasn't been done yet
        if (!modalTriggeredAlready) {
            modalTriggeredAlready = true;
            $("#myModal").modal();
        }
    }

    if ($window.DeviceLightEvent) {
        $window.addEventListener('devicelight', function (event) {
            // If a light change event is detected, save the new value
            ambientLightLevel = event.value;
        });
    } else {
        // Generate simulated data
        ambientLightLevel = Math.random() * 300;
        // Fire a notification if it hasn't been done yet
        if (!modalTriggeredAlready) {
            modalTriggeredAlready = true;
            $("#myModal").modal();
        }
    }

    // Function accessible by the service
    return {
        // Getting or setting the set point; no longer used!
        /*
        updateSetPoint: function (newvalue) {
            setPointValue = newvalue;
        },
        currentSetPoint: setPointValue
        ,
        */
        // Here is where you reference in the "type" of asset that is displayed--for example, phone, pump, etc.
        friendlyAssetName: CONST_FRIENDLY_ASSET_NAME
        ,
        // Functions for sending PI Web API Queries
        getElements: function (elementTemplate) {
            if (_afdbwebid) {
                var url = _httpsPIWebAPIUrl + 'assetdatabases/' + _afdbwebid + '/elements?searchFullHierarchy=true&templateName=' + elementTemplate;
                return $http.get(url).then(function (response) { return response.data.Items});
            }
            else {

                return getafdb().then(function (webid) {
                    _afdbwebid = webid;
                    var url = _httpsPIWebAPIUrl + 'assetdatabases/' + _afdbwebid + '/elements?searchFullHierarchy=true&templateName=' + elementTemplate;

                    return $http.get(url).then(function (response) { return response.data.Items });
                });
            }
        },
        getElementAttributes: function (elementTemplate,elementNameFilter,attributeCategory) {
            if (_afdbwebid) {
                var url = buildElementAttributesUrl(elementTemplate, elementNameFilter, attributeCategory);

                return $http.get(url).then(function (response) {
                    return response.data.Items;
                });
            } else {
                return getafdb().then(function (webid) {
                    _afdbwebid = webid;

                    var url = buildElementAttributesUrl(elementTemplate, elementNameFilter, attributeCategory);

                    return $http.get(url).then(function (response) {
                        return response.data.Items;
                    });

                });
            }
        },
        getSnapshots: function (attributes) {
            var url = constructUrl(_httpsPIWebAPIUrl + '/streamsets/value?', attributes);
            return $http.get(url).then(function (response) {
                return response;
            });                
        },
        getPloValues : function (attributes) {
            var url = constructUrl(_httpsPIWebAPIUrl + '/streamsets/plot?startTime=' + _startTime + '&endTime' + _endTime + '&', attributes);
            return $http.get(url).then(function (response) {
                return response;
            });        
        },
        getTargetAsset: function (assetName) {
            var assetid = assetName.match(/[0-9]+/i)[0];
            return 'Phone ' + assetid + ' Sensors';

        },
        sendDatatoPI: function (elementTemplate, targetAssetName) {

            this.getElementAttributes(elementTemplate, targetAssetName).then(function (attributes) {
                sendCurrentReadings(attributes);
            });
        }
   };
}]);
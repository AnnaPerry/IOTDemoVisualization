﻿'use strict';
angular.module('iotdemoApp')
.service('dataService', ['$http', '$q', '$interval', '$window', function ($http, $q, $interval, $window) {

 
      var _httpsPIWebAPIUrl = "https://pi4egdemo1/piwebapi/";
    //var _httpsPIWebAPIUrl = "https://arcadia.osisoft.int/piwebapi/";
    var _afserver = 'localhost';
    var _afdb = 'Asset Framework DB 1';
    var _afdbwebid = '';
    var _startTime = '*-10m';
    var _endTime = '*';
    
    var currentXYZAccelerationReadings;

    var setPointValue = 50;

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
        //form data request

        // Define global variables to hold recent sensor readings
        var dataObj = [];
        var timestamp = "*";
        var batteryLevel = 100;
        var proximityValue = 3; // in centimenters
        var ambientLightLevel = 320; // in lux

        $window.navigator.getBattery().then(function (battery) {
         
            attributes.forEach(function (attribute) {

                var value;
                switch (attribute.Name) {
                    case "Set point": {
                        value = setPointValue;
                        break;
                    }
                    case "Bearing oil health": {
                        value = 100 * battery.level;
                        break;
                    }
                    case "X-axis acceleration": {
                        value = currentXYZAccelerationReadings.x;
                        break;
                    }
                    case "Y-axis acceleration": {
                        value = currentXYZAccelerationReadings.y;
                        break;
                    }
                    case "Z-axis acceleration": {
                        value = currentXYZAccelerationReadings.z;
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
    function getBattery() { return navigator.getBattery().then(function (battery) { return 100 * battery.level }); }

    // Set up a handler to track motion
    if ($window.DeviceMotionEvent) {
        $window.addEventListener('devicemotion', function (event) {
            // Get the current acceleration values in 3 axes (measured in meters per second squared)
            if (!event.acceleration.x) {
                currentXYZAccelerationReadings = {
                    x: Math.random(), // generate random data; used to simply set these to 0
                    y: Math.random(),
                    z: Math.random()
                };
            } else {
                currentXYZAccelerationReadings = event.acceleration;
            }
        }, false);

    };

    // Also set up handlers for tracking proximity and light level
    if ($window.DeviceProximityEvent) {
        $window.addEventListener('deviceproximity', function (event) {
            // If a proximity event is detected, save the new proximity value
            proximityValue = event.value;
        });
    }
    if ($window.DeviceLightEvent) {
        $window.addEventListener('devicelight', function (event) {
            // If a light change event is detected, save the new value
            ambientLightLevel = event.value;
        });
    }

    
    // Reading or writing to the PI System -----------------------------------------------------------------------------

    return {

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
        

    },
    updateSetPoint: function (newvalue) {
        setPointValue = newvalue;
    },
    currentSetPoint: setPointValue
    ,
    friendlyAssetName: 'Pump'
   };



}]);
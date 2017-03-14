'use strict';
angular.module('iotdemoApp')
.service('dataService', ['$http', '$q', '$interval', '$window', function ($http, $q, $interval, $window) {

 
    var _httpsPIWebAPIUrl = "https://pi4egdemo1/piwebapi/";
    var _afserver = 'localhost';
    var _afdb = 'Asset Framework DB 1';
    var _afdbwebid = '';
    var _startTime = '*-10m';
    var _endTime = '*';


    //hardcoding the root element and selected asset
    var rootElement = "\\\\"+ _afserver +"\\Asset Framework DB 1\\Assets";
    var targetElementPath = "\\\\" + _afserver + "\\Asset Framework DB 1\\zzz Data Generation\\Phone 1 Sensors";
    var selectedAsset = "Asset 1";
    
    var currentXYZAccelerationReadings;


    var _targetattributes;
    var snapshotUrl, plotUrl;

    var setPointValue = 50;

    function getafdb() {
        var url = _httpsPIWebAPIUrl + 'assetdatabases?path=\\\\' + _afserver + '\\' + _afdb;
        return $http.get(url).then(function (response) {
            return response.data.WebId;
        });

    };

    function getAttributesPromise(path) {

        var getElementUrl = encodeURI(_httpsPIWebAPIUrl + "/elements?path=" + path);
        
            var batchRequest = {};
            batchRequest["GetTopElement"] = {
                "Method": "GET",
                "Resource": getElementUrl
            };

            batchRequest["getAttributes"] = {
                "Method": "GET",
                "Resource": "{0}",
                "ParentIds": ["GetTopElement"],
                "Parameters": ["$.GetTopElement.Content.Links.Attributes"]
            }


           return $http({
                url: _httpsPIWebAPIUrl + "/batch",
                method: 'POST',
                data: JSON.stringify(batchRequest),
                Headers: { 'Content-Type': 'application/json' }
            }).then(function (response) {
                var attributes = response.data.getAttributes.Content.Items;
                return attributes;
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

        var dataObj = [];
        var timestamp = "*";
        var batteryLevel;


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
                }
                
                dataObj.push({ 'WebId': attribute.WebId, 'Value': { 'Timestamp': timestamp, 'Value': value } });

            });
            //console.log(dataObj);
            var url = _httpsPIWebAPIUrl + "/streamsets/value";
            $http.post(url, JSON.stringify(dataObj), {'Content-Type': 'application/json'});

        });


    };

    function getBattery() { return navigator.getBattery().then(function (battery) { return 100 * battery.level }); }

    if ($window.DeviceMotionEvent) {
        $window.addEventListener('devicemotion', function (event) {
            // Get the current acceleration values in 3 axes (measured in meters per second squared)
            if (!event.acceleration.x) {
                currentXYZAccelerationReadings = {
                    x: 0,
                    y: 0,
                    z: 0
                };
            } else {
                currentXYZAccelerationReadings = event.acceleration;
            }
        }, false);

    };
    


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
    friendlyAssetName: 'Pump'
   };



}]);
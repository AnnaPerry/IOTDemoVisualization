'use strict';
angular.module('iotdemoApp')
.service('dataService', ['$http', '$q', '$interval', '$window', function ($http, $q, $interval, $window) {

 

    var _wssPIWebAPIUrl = "wss://pi4egdemo1/piwebapi";
    var _httpsPIWebAPIUrl = "https://pi4egdemo1/piwebapi";
    var _afserver = "localhost"


    //hardcoding the root element and selected asset
    var rootElement = "\\\\"+ _afserver +"\\Asset Framework DB 1\\Assets";
    var targetElementPath = "\\\\" + _afserver + "\\Asset Framework DB 1\\zzz Data Generation\\Phone Sensors";
    var selectedAsset = "Asset 1";
    var startTime = '*-10m';
    var endTime = '*';
    var currentXYZAccelerationReadings;


    var _attributes, _targetattributes;
    var snapshotUrl, plotUrl;

    var setPointValue = 50;

    function getAttributesPromise(path) {

        //var deferred = $q.defer();
        //if(attributes){
        //    deferred.resolve(attributes);
        //}
        //else{

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
        
    //    }

      //  return deferred.promise;


    };

    function constructUrl(url, attrarray, filters) {
        
        attrarray.forEach(function (attribute) {
            //filter by name. Ideally will switch this to filter by af category. 
            if (_.contains(filters, attribute.Name)) {
                url += 'webid=' + attribute.WebId + '&'
            }
        });
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
    

    var stop;
       return {
        //get data here
    getSnapshots : function (filterParams) {

        //if (angular.isDefined(stop)) $interval.cancel(stop);;

       // stop = $interval(function () {
            if (_attributes && snapshotUrl) {
                //var dataUrl = constructUrl(_httpsPIWebAPIUrl + '/streamsets/value?', _attributes, filterParams);

                return $http.get(snapshotUrl).then(function (response) {
                   // snapshots.Items = response.data.Items;
                    return response;
                });

            }
            else {
                return getAttributesPromise(rootElement + "\\" + selectedAsset).then(function (response) {
                    _attributes = response;
                    snapshotUrl = constructUrl(_httpsPIWebAPIUrl + '/streamsets/value?', _attributes, filterParams);

                    return $http.get(snapshotUrl).then(function (response) {
                     //   snapshots.Items = response.data.Items;
                        return response;
                    });
                });
            }
        //}, 10000);
            
    },
    getPloValues : function (filterParams) {
        if (_attributes && plotUrl) {
            
            return $http.get(plotUrl).then(function (response) {
                return response;
            });

        }
        else {
            return getAttributesPromise(rootElement + "\\" + selectedAsset).then(function (response) {
                _attributes = response;
                plotUrl = constructUrl(_httpsPIWebAPIUrl + '/streamsets/plot?startTime=' + startTime + '&endTime' + endTime + '&', _attributes, filterParams);

                return $http.get(plotUrl).then(function (response) {
                    return response;
                });
            });
        }
    },
    sendDatatoPI : function () {
        if (_targetattributes) {
            sendCurrentReadings(_targetattributes);

        } else {

            getAttributesPromise(targetElementPath).then(function (response) {
                _targetattributes = response;
                sendCurrentReadings(_targetattributes);
                //construct data object


            });
        }

    },
    updateSetPoint: function (newvalue) {
        setPointValue = newvalue;
    }
   };



}]);
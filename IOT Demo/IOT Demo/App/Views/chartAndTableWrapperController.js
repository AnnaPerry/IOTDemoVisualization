'use strict';
app.controller('chartAndTableWrapperController', ['$scope', '$stateParams', '$interval', 'dataService', function ($scope, $stateParams, $interval, dataService) {

    var afTemplate = 'Phone Sensors Template';
    var attributeCategory = '*';

    $scope.init = function () {
    };


    // When this scope is closed, stop the recurring interval timer
    var stop;
    $scope.$on('$destroy', function () {
        stopInt();
    });

    // Function that allows you to stop the recurring interval timer
    function stopInt() {
        if (angular.isDefined(stop)) {
            $interval.cancel(stop);
            stop = undefined;
        };
    };

    // If phone data collection is used, show the phone image and help button; else, hide them
    $scope.showOrHideThisElement = function () {
        return (dataService.enablePhoneBasedDataCollectionFeatures());
    }

    // The interval timer gets the target AF asset and calls the dataservice to send live data from this device's sensors to the PI System
    $scope.sendDatatoPI = function () {
        stop = $interval(function () {
            var targetAsset = dataService.getTargetAssetElementName($stateParams.assetName);
            dataService.sendDatatoPI(afTemplate, targetAsset, attributeCategory);
        }, 3000);
    };

}]);
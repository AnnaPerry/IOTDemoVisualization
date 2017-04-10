'use strict';
app.controller('outputController', ['$scope', '$http', '$interval', 'dataService', function ($scope, $http, $interval, dataService) {


    $scope.init = function () {
        //console.log(dataService);
        $scope.rangeValue = dataService.currentSetPoint;

        if (angular.isDefined(stop)) return;

        dataService.updateSetPoint($scope.rangeValue);
    };

    $scope.update = function () {
        dataService.updateSetPoint($scope.rangeValue);
    };



}]);
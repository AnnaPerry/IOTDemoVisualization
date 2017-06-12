'use strict';
app.controller('tableController', ['$scope', '$http', '$interval', '$stateParams', 'dataService', function ($scope, $http, $interval,$stateParams, dataService) {

    //var afTemplate = 'Asset Template';
	var afTemplate = ''; // Template name is no longer needed; now searching is done by name, not by template!	
    var assetName = $stateParams.assetName;
    var afAttributeCategory = 'Snapshot';

    var stop;

    $scope.init = function () {

        dataService.getElementAttributes(afTemplate, assetName, afAttributeCategory).then(function (attributes) {
            dataService.getSnapshots(attributes).then(function (response) {
                $scope.dataArray = response.data.Items;
            });

            stop = $interval(function () {
                dataService.getSnapshots(attributes).then(function (response) {
                    $scope.dataArray = response.data.Items;
                });
            }, 5000);

        });

    };

    $scope.$on('$destroy', function () {
        stopInt();
    });

    function stopInt() {
        if (angular.isDefined(stop)) {
            $interval.cancel(stop);
            stop = undefined;
        };
    };

}]);
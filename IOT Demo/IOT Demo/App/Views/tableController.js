'use strict';
app.controller('tableController', ['$scope', '$http', '$interval', '$stateParams', 'dataService', function ($scope, $http, $interval,$stateParams, dataService) {

    //var afTemplate = 'Asset Template';
	var afTemplate = '';
    var assetName = $stateParams.assetName;
    var afAttributeCategory = 'Snapshot';

    var stop;

	// Specify how often should the visualization be updated (and new data requested from the PI System)
	var DATA_REFRESH_INTERVAL_IN_MILLISECONDS = 5000;

    $scope.init = function () {

        dataService.getElementAttributes(afTemplate, assetName, afAttributeCategory).then(function (attributes) {
            dataService.getSnapshots(attributes).then(function (response) {
                $scope.dataArray = response.data.Items;
				// Turn off the loading spinner
				document.getElementById("loadingSpinner").style.visibility = "hidden"; 
            });

            stop = $interval(function () {
                dataService.getSnapshots(attributes).then(function (response) {
                    $scope.dataArray = response.data.Items;
                });
            }, DATA_REFRESH_INTERVAL_IN_MILLISECONDS);

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
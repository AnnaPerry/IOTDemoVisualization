'use strict';
app.controller('tableController', ['$scope', '$http', '$interval', '$stateParams', 'dataService', function ($scope, $http, $interval,$stateParams, dataService) {

	var afTemplate = '';
    var assetName = $stateParams.assetName;
    var afAttributeCategory = 'Snapshot';
    var stop;

	// Specify how often should the visualization be updated (and new data requested from the PI System)
	var DATA_REFRESH_INTERVAL_IN_MILLISECONDS = 5000;
	
    // When this scope is closed, stop the recurring interval timer
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
	
    $scope.init = function () {
		document.getElementById("loadingSpinner2").style.display = "inline";
        dataService.getElementAttributes(afTemplate, assetName, afAttributeCategory).then(function (attributes) {
			$scope.attributes = _.map(attributes, function (attribute) { return {Name: attribute.Name}});
            dataService.getSnapshots(attributes).then(function (response) {
                $scope.dataArray = response.data.Items;
				// Turn off the loading spinner
				document.getElementById("loadingSpinner2").style.display = "none";
            });

            stop = $interval(function () {
                dataService.getSnapshots(attributes).then(function (response) {
                    $scope.dataArray = response.data.Items;
                });
            }, DATA_REFRESH_INTERVAL_IN_MILLISECONDS);

        });
    };

}]);
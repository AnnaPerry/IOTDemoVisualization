'use strict';
app.controller('tableController', ['$scope', '$stateParams', 'dataService', function ($scope, $stateParams, dataService) {

	// Define constant values used for looking up element attributes for displaying on this view
	var afElementCategory = DEFAULT_AF_ELEMENT_CATEGORY;
	var afTemplate = DEFAULT_AF_TEMPLATE;
    var assetName = $stateParams.assetName;
    var afAttributeCategory = SNAPSHOT_DATA_ATTRIBUTE_CATEGORY;
	var includeAttributeNameInQueryResults = false;
    var stop;
	
    // When this scope is closed, stop the recurring interval timer
    $scope.$on('$destroy', function () {
        stopInt();
    });

	// Function that allows you to stop the recurring interval timer
    function stopInt() {
        if (angular.isDefined(stop)) {
			clearTimeout(stop);
            stop = undefined;
        };
    };
	
    $scope.init = function () {
		// Show the loading spinner
		document.getElementById("loadingSpinnerIcon").className = "fa fa-spinner fa-spin fa-fw";
        dataService.getElementAttributes(afTemplate, afElementCategory, assetName, afAttributeCategory, includeAttributeNameInQueryResults).then(function (attributes) {
			// Turn off the loading spinner
			document.getElementById("loadingSpinnerIcon").className = "fa fa-refresh fa-fw"; 
			// Allow the table to use the asset name as its header
			$scope.currentAssetName = assetName;
			performRepetitiveActionsForTheseAFAttributes(attributes);
        });
    };
	
	// Repetitive function!  Contains behavior for getting data and acting on it
	function performRepetitiveActionsForTheseAFAttributes(attributes) {
		 dataService.getSnapshots(attributes).then(function (response) {
			try {
				$scope.dataArray = response.data.Items;
			} catch (err) {
				console.log("An error occurred when trying to read the response data.Items: " + err.message);
			}
		});
		
		// Call this function again after a certain time range
		stop = setTimeout( function() {
			performRepetitiveActionsForTheseAFAttributes(attributes)
		}, DATA_REFRESH_INTERVAL_IN_MILLISECONDS);		
	}

}]);
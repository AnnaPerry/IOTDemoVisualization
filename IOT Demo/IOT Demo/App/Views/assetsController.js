'use strict';
app.controller('assetsController', ['$scope', '$http', '$interval', 'dataService', function ($scope, $http, $interval, dataService) {

    var afAssetTemplate = 'Asset Template';

    $scope.init = function () {
		// Show the top navbar
		document.getElementById("mainNavbarContainer").style.display = "block";
		// Show the loading spinner
		document.getElementById("loadingSpinnerIcon").className = "fa fa-spinner fa-spin fa-fw";
		// Get a list of elements to display on the table
        dataService.getElements(afAssetTemplate).then(function (assets) {
            $scope.assetArray = assets;
            //console.log(assets);
			// Turn off the loading spinner
			document.getElementById("loadingSpinnerIcon").className = "fa fa-refresh fa-fw"; 
        });
    }; 
}]);
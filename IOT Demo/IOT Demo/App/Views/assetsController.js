'use strict';
app.controller('assetsController', ['$scope', '$http', '$interval', 'dataService', function ($scope, $http, $interval, dataService) {

	// Get all of the buttons that should only be shown when an asset has selected, and set their correct visibility
	var buttonElements = document.getElementsByClassName("showChartBarAndTableButtonsClass");
	for (var i = 0; i < buttonElements.length; i++) {
		buttonElements[i].style.display = "none";
		//buttonElements[i].style.display = "block";
	}
	
    var afAssetTemplate = 'Asset Template';

    $scope.init = function () {
		// Show the top navbar
		//document.getElementById("mainNavbarContainer").style.display = "block";
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
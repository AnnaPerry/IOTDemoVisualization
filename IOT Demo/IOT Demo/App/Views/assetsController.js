﻿'use strict';
app.controller('assetsController', ['$scope', '$http', 'dataService', function ($scope, $http, dataService) {

	// Get all of the buttons that should only be shown when an asset has selected, and set their correct visibility
	var buttonElements = document.getElementsByClassName("showChartBarAndTableButtonsClass");
	for (var i = 0; i < buttonElements.length; i++) {
		buttonElements[i].style.display = "none";
		//buttonElements[i].style.display = "block";
	}
	
    //var afAssetTemplate = 'Asset Template';
	var afTemplate = DEFAULT_AF_TEMPLATE;
	var afElementCategory = DEFAULT_AF_ELEMENT_CATEGORY;

    $scope.init = function () {
		// Show the top navbar
		//document.getElementById("mainNavbarContainer").style.display = "block";
		// Show the loading spinner
		document.getElementById("loadingSpinnerIcon").className = "fa fa-spinner fa-spin fa-fw";
		// Get a list of elements to display on the table
		dataService.getElements(afTemplate, afElementCategory).then(function (assets) {
			$scope.assetArray = assets;
			//console.log(assets);
			// Turn off the loading spinner
			document.getElementById("loadingSpinnerIcon").className = "fa fa-refresh fa-fw"; 
		});
    }; 
}]);
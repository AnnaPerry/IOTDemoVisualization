'use strict';
app.controller('gettingStartedController', ['$scope', '$http', '$stateParams', function ($scope, $http, $stateParams) {
	
	// Get all of the buttons that should only be shown when an asset has selected, and set their correct visibility
	var buttonElements = document.getElementsByClassName("showChartBarAndTableButtonsClass");
	for (var i = 0; i < buttonElements.length; i++) {
		buttonElements[i].style.display = "none";
		//buttonElements[i].style.display = "block";
	}
	
	$scope.init = function () {
		// Turn off the loading spinner
		document.getElementById("loadingSpinnerIcon").className = "fa fa-refresh fa-fw"; 
    };
}]);
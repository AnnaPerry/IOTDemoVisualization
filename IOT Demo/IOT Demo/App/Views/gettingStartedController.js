'use strict';
app.controller('gettingStartedController', ['$scope', '$http', '$stateParams', function ($scope, $http, $stateParams) {
    $scope.init = function () {
		// Show the top navbar
		document.getElementById("mainNavbarContainer").style.display = "block";
		// Turn off the loading spinner
		document.getElementById("loadingSpinnerIcon").className = "fa fa-refresh fa-fw"; 
    };
}]);
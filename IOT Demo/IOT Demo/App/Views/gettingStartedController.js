'use strict';
app.controller('gettingStartedController', ['$scope', '$http', '$stateParams', function ($scope, $http, $stateParams) {
    $scope.init = function () {
			// Show the top navbar
			document.getElementById("mainNavbarContainer").style.display = "block";
    };
}]);
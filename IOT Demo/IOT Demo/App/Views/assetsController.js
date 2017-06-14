'use strict';
app.controller('assetsController', ['$scope', '$http', '$interval', 'dataService', function ($scope, $http, $interval, dataService) {

    var afPhoneTemplate = 'Phone Sensors Template';
    var afAssetTemplate = 'Asset Template';
    $scope.friendlyAssetName = dataService.friendlyAssetName;

    $scope.selectedAsset;

    $scope.init = function () {
        dataService.getElements(afAssetTemplate).then(function (assets) {
            $scope.assetArray = assets;
            //console.log(assets);
			// Turn off the loading spinner
			document.getElementById("loadingSpinner").style.visibility = "hidden"; 
        });
    }; 
}]);
'use strict';
app.controller('kpiController', ['$scope', '$http', '$interval', 'dataService', function ($scope, $http, $interval, dataService) {

    var KPIattributes = [
        "Bearing oil health",
        "Hours until next bearing service",
        "Engineer scheduled for next bearing service",
        "Phone for Engineer scheduled for next bearing service",
        "Set point"
    ];


    $scope.snapshots = {Items: []};

    var stop;

    $scope.init = function () {
        
        if (angular.isDefined(stop)) return;

        
        //first request goes to get the data fast
        dataService.getSnapshots(KPIattributes).then(function (response) {
            $scope.snapshots.Items = response.data.Items;
        });

        //then sign up to get data every 10 seconds
         stop = $interval(function () {
            dataService.getSnapshots(KPIattributes).then(function (response) {
                $scope.snapshots.Items = response.data.Items;
            });

        }, 10000);
        
        
        
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
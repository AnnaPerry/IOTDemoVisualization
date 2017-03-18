'use strict';
app.controller('mainController', ['$scope', '$interval', 'dataService', function ($scope, $interval, dataService) {

    var afTemplate = 'Top-Level Assets Template';
    var assetName = 'Assets';
    var afAttributeCategory = 'KPIs and Rollups';

    var healthChart, setpointChart;
    var stop;

    $scope.init = function () {
        dataService.getElementAttributes(afTemplate, assetName, afAttributeCategory).then(function (attributes) {

            dataService.getSnapshots(attributes).then(function (response) {

                var dataArray = response.data.Items;

                $scope.health = _.findWhere(dataArray, { Name:  'Average Oil Health' });
                $scope.setpoint = _.findWhere(dataArray,{ Name: 'Average Set Point' });
                $scope.maintenancedate = _.findWhere(dataArray, { Name: 'Nearest Maintenance Date' });

                updatecharts();
            });

            stop = $interval(function () {
                dataService.getSnapshots(attributes).then(function (response) {

                    var dataArray = response.data.Items;

                    $scope.health = _.findWhere(dataArray, { Name: 'Average Oil Health' });
                    $scope.setpoint = _.findWhere(dataArray, { Name: 'Average Set Point' });
                    $scope.maintenancedate = _.findWhere(dataArray, { Name: 'Nearest Maintenance Date' });

                    updatecharts();
                });

            }, 5000);

        });
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


    $scope.makeHealthChart = function () {
        healthChart = AmCharts.makeChart("healthChartDiv", HealthChartDef);
    };
    $scope.makeSetPointChart = function () {
        setpointChart = AmCharts.makeChart("setpointChartDiv", SetPointChartDef);
    };


    var updatecharts = function () {
        if (!healthChart || !setpointChart || !$scope.health || !$scope.setpoint) return;

        healthChart.axes[0].bands[0].setEndValue($scope.health.Value.Good ? $scope.health.Value.Value : 0);
        healthChart.axes[0].setBottomText(($scope.health.Value.Good ? $scope.health.Value.Value : 0) + "%");
        


        setpointChart.axes[0].bands[0].setEndValue($scope.setpoint.Value.Good ? $scope.setpoint.Value.Value : 0);
        setpointChart.axes[0].setBottomText(($scope.setpoint.Value.Good ? $scope.setpoint.Value.Value : 0) + "%");


    };


    
    var HealthChartDef = {
        "type": "gauge",
        "theme": "light",
        "axes": [{
            "axisThickness": 1,
            "axisAlpha": 0.2,
            "tickAlpha": 0.2,
            "valueInterval": 100,
            "bands": [{
                "color": "green",
                "endValue": 0,
                "innerRadius": "70%",
                "startValue": 0
            }],
            "bottomText": "---",
            "endValue": 100
        }]

    };
    var SetPointChartDef = {
           "type": "gauge",
           "theme": "light",
           "axes": [{
               "axisThickness": 1,
               "axisAlpha": 0.2,
               "tickAlpha": 0.2,
               "valueInterval": 100,
               "bands": [{
                   "color": "green",
                   "endValue": 0,
                   "innerRadius": "70%",
                   "startValue": 0
               }],
               "bottomText": "---",
               "endValue": 100
           }]

       };



}]);
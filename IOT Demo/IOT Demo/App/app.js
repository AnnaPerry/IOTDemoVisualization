'use strict';
var app = angular.module('iotdemoApp', ['ui.router'])
.config(['$stateProvider', '$locationProvider', function ($stateProvider, $locationProvider) {

    $locationProvider.hashPrefix('');

    $stateProvider
                .state({
                    name: 'home',
                    url: '/',
                    templateUrl: 'App/Views/mainView.html',
                    controller: 'mainController'
                })
                .state({
                    name: 'assetoverview',
                    url: '/assets',
                    templateUrl: 'App/Views/assetsView.html',
                    controller: 'assetsController'
                })
                .state({
                    name: 'arview',
                    url: '/ar/:assetName',
                    templateUrl: 'App/Views/arView.html',
                    controller: 'arController',
                    resolve: {
                        assetName: ['$stateParams', function ($stateParams) { return $stateParams.assetName }]
                    }
                })
                .state({
                    name: 'arview.chart',
                    url: '/chart/',
                    templateUrl: 'App/Views/chartView.html',
                    controller: 'chartController'
                })
                .state({
                    name: 'arview.table',
                    url: '/table/',
                    templateUrl: 'App/Views/tableView.html',
                    controller: 'tableController'
                })
                .state({
                    name: 'arview.change',
                    url: '/change/',
                    templateUrl: 'App/Views/outputView.html',
                    controller: 'outputController'
                })


}]);


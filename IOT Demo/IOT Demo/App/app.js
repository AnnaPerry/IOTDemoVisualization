'use strict';
var app = angular.module('iotdemoApp', ['ui.router'])
.config(['$stateProvider', '$locationProvider', '$urlRouterProvider', function ($stateProvider, $locationProvider, $urlRouterProvider) {

    $locationProvider.hashPrefix('');
    
    $urlRouterProvider.otherwise('/');

    $stateProvider
        .state({
            name: 'home',
            url: '/',
            templateUrl: 'App/Views/mainView.html',
            controller: 'mainController'
        })
        .state({
            name: 'gettingstarted',
            url: '/gettingstarted',
            templateUrl: 'App/Views/gettingStartedView.html',
			controller: 'gettingStartedController'
        })
        .state({
            name: 'assetoverview',
            url: '/assets',
            templateUrl: 'App/Views/assetsView.html',
            controller: 'assetsController'
        })
        .state({
            name: 'chartAndTableWrapperView',
            url: '/ar/:assetName',
            templateUrl: 'App/Views/chartAndTableWrapperView.html',
            controller: 'chartAndTableWrapperController',
            abstract: true,
            resolve: {
                assetName: ['$stateParams', function ($stateParams) { return $stateParams.assetName }]
            }
        })
        .state({
            name: 'chartAndTableWrapperView.chart',
            url: '/chart/',
            templateUrl: 'App/Views/chartView.html',
            controller: 'chartController'
        })
        .state({
            name: 'chartAndTableWrapperView.table',
            url: '/table/',
            templateUrl: 'App/Views/tableView.html',
            controller: 'tableController'
        })
        .state({
            name: 'chartAndTableWrapperView.gauges',
            url: '/gauges/',
            templateUrl: 'App/Views/gaugesView.html',
            controller: 'gaugesController'
        })		
}]);

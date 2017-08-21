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
            name: 'assetoverview',
            url: '/assets',
            templateUrl: 'App/Views/assetsView.html',
            controller: 'assetsController'
        })
		// This is the wrapper state for the chart and bars and table
        .state({
            name: 'chartAndTableWrapperView',
            url: '/viewAsset/:assetName',
            templateUrl: 'App/Views/chartAndTableWrapperView.html',
            controller: 'chartAndTableWrapperController',
            abstract: true,
            resolve: {
                assetName:  ['$stateParams', function ($stateParams) { return $stateParams.assetName }]
            }/*,
			params: {
				assetWebId: null
			}*/
        })
		// These are all the child states that appear within the wrapper view
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
            name: 'chartAndTableWrapperView.bars',
            url: '/bars/',
            templateUrl: 'App/Views/barsView.html',
            controller: 'barsController'
        })
		// Last, here is the entry for the getting started view
        .state({
            name: 'gettingstarted',
            url: '/gettingstarted',
            templateUrl: 'App/Views/gettingStartedView.html',
			controller: 'gettingStartedController'
        })		
}]);

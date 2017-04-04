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
                    name: 'help',
                    url: '/help',
                    templateUrl: 'App/Views/helpView.html'//,
                    //controller: 'helpController'
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
                    abstract: true,
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


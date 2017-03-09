'use strict';
var app = angular.module('iotdemoApp', ['ngRoute'])
.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {


    $locationProvider.hashPrefix('');

    $routeProvider.when('/Summary', {
        controller: 'kpiController',
        templateUrl: '/App/Views/kpiView.html',
    }).when('/Details', {
        controller: 'rawdataController',
        templateUrl: '/App/Views/rawdataView.html',
    }).when('/TimeSeries', {
        controller: 'timeseriesController',
        templateUrl: '/App/Views/timeseriesView.html',
    }).when('/Change', {
        controller: 'outputController',
        templateUrl: '/App/Views/outputView.html',
    }).otherwise({ redirectTo: '/Summary' });

}]);


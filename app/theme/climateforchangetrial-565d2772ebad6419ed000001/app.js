'use strict';

// Declare app level module which depends on views, and components
angular.module('c4cWebsite', [
  'ngRoute',
  'c4cWebsite.actions'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/'});
}]);

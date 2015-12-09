'use strict';

angular.module('c4cWebsite.actions', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'actions_grid.html',
    controller: 'ActionsGridController'
  });
  $routeProvider.when('/actions/:categoryName', {
    templateUrl: 'actions_list.html',
    controller: 'ActionsListController'
  });
}])

.controller('ActionsGridController', [function() {

}])

.controller('ActionsHintController', [function() {

}])

.controller('ActionsListController', [function() {

}]);
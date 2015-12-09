'use strict';

(function() {

angular.module('c4cWebsite.actions', ['ngRoute', 'times.tabletop'])

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

.controller('ActionsGridController', ['$scope', 'Tabletop', ActionsGridController])

.controller('ActionsListController', [function() {

}])

.directive('actionHint', function ActionsHintDirective() {
  return {
    restrict: 'E',
    templateUrl: 'actions_hint.html',
    controller:  ['$scope', ActionHintsController]
  }
});

/**
  * ActionsGridController
  *
  * $scope variables
  * * categories	Array of the form [{Name: ".."}, {...}]
  */
function ActionsGridController($scope, Tabletop) {
	$scope.categories = [];

	Tabletop.then(function(sheets) {
		// Get the Categories table
		var table = sheets[0]["Categories"];
		
		// Put the categories on the scope
		$scope.categories = table.all();
    });
}

/**
  * ActionsHintController
  *
  * $scope variables
  * * hint	object containing name and link
  */
function ActionHintsController($scope) {
	$scope.hint = {
		name: 'changing their power',
		link: '/act_power'
	}
}

})();
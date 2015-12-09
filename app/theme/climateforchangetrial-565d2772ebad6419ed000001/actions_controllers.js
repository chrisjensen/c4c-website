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

.controller('ActionsListController', ['$scope', '$routeParams', 'Tabletop', ActionsListController])

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

/**
  * ActionsListController
  *
  * $scope variables
  * * actions	Array of actions to display, the actions will be filtered according to
  *				category
  * * category	The category on display
  */
function ActionsListController($scope, $routeParams, Tabletop) {
	var vm = this,
		categoryName = $routeParams.categoryName;

	$scope.actions = [];
	
	$scope.category = {
		Name: categoryName
	};
	
	Tabletop.then(function(sheets) {
		// Find this category
		var table = sheets[0]["Categories"];
		var category = $.grep(table.all(), function(cat){
			return (cat.Name == categoryName);
		}).shift();
		
		// Put it's details on the scope
		$scope.category = category;
	
		// Get the Actions table
		var table = sheets[0]["Actions"];
		
		$scope.actions = table.all();
		
		// Filter actions for this category
		$scope.actions = $.grep($scope.actions, function(action) {
			return (action["Category"] == categoryName);
		});
		
		// Remove any actions that we can't show
		$scope.actions = $.grep($scope.actions, canShow);

		// Set the class for the action		
		$scope.actions.forEach(function(action) {
			action["class"] = actionCSSClass(action);
		});
    });
    
    /**
      * Returns true if the action should be displayed,
      * ie:
      * Does it have a name and a slug?
      * Is it enabled?
      * Does it have a corresponding page?
      * Should we hide it because they've finished it and can't repeat?
      */
    function canShow(action) {
    	// Does it have a name and a slug?
    	if ((action["Title"].trim().length == 0) || 
    		(action["Slug"].trim().length == 0)) {
    		return false;
    	}
    	
    	// Is it enabled?
    	if (action["Enabled"] != "Y") {
    		return false;
    	}
    	
    	// Should we hide it because they've finished it and can't repeat?

    	// Does it have a corresponding page?
    	
    	return true;
    }  
    
    /**
      * Returns CSS classes for the action
      */
    function actionCSSClass(action) {
    	var htmlClass = '';
    
    	// Set done if it's been done
    	//XXXX
    	
    	// Set the class for the category
    	htmlClass += 'act_cat_' + makeSafeForCSS(action["Category"]);
    	
    	return htmlClass;
    }  
    
    /**
      * Takes a string and makes it safe to use as a CSS name
      */
	function makeSafeForCSS(name) {
		return name.replace(/[^a-z0-9]/g, function(s) {
			var c = s.charCodeAt(0);
			if (c == 32) return '_';
			if (c >= 65 && c <= 90) return s.toLowerCase();
			return '__' + ('000' + c.toString(16)).slice(-4);
		});
	}    
}

})();
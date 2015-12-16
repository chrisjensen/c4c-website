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

.controller('ActionsListController', ['$scope', '$routeParams', '$log', 'Tabletop', ActionsListController])

.directive('actionHint', function ActionsHintDirective() {
  return {
    restrict: 'E',
    templateUrl: 'actions_hint.html',
    controller:  ['$scope', ActionHintsController]
  }
})

.directive('actionListItem', function ActionsListItemDirective() {
  return {
    restrict: 'E',
    templateUrl: 'action_list_item.html',
    scope: { action: '=' },
    controller:  ['$scope', ActionListItemController]
  }
})

.directive('badgesList', function BadgesListDirective() {
  return {
    restrict: 'E',
    templateUrl: 'badges_list.html',
    controller:  ['$scope', '$log', 'Tabletop', BadgesListController]
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
  * BadgesListController
  *
  * $scope variables
  * * badges	array of badges the current user has earned of the form:
  *		{ 
  *			Badge: 'Label of the Badge'
  *			Description: 'Description of the badge'
  *		}
  */
function BadgesListController($scope, $log, Tabletop) {
	$scope.badges = [];
	
	Tabletop.then(function(sheets) {
		// Find this category
		var actions = sheets[0]["Actions"].all();

		angular.forEach(actions, function(action) {
			var showBadge = true;
		
			if (!action["Badge"]) {
				$log.debug('Not showing badge for action (' + action["tag"] + ') because there is no badge name set.');
			}
		
			if ($.inArray(action["end tag"], c4c.user_tags) > -1) {
				$log.debug('Not showing badge for action (' + action["tag"] + ") because the user hasn't completed that action.");
				
				if (c4c.demoMode) {
					$log.info('Showing badge anyway because demoMode is on: ' + action["tag"]);
				}
				else {
					showBadge = false;
				}
			}
			
			if (showBadge) {
				$scope.badges.push(angular.copy(action));
			}
		});
	});
}

/**
  * ActionsListController
  *
  * $scope variables
  * * actions	Array of actions to display, the actions will be filtered according to
  *				category
  * * category	The category on display
  */
function ActionsListController($scope, $routeParams, $log, Tabletop) {
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
			$log.error("action is broken (slug: " + action["Slug"] + ") It must have a slug and title in the actions matrix spreadsheet.");

    		return false;
    	}
    	
    	// Is it enabled?
    	if (action["Enabled"] != "Y") {
			$log.info("action is disabled (slug: " + action["Slug"] + ") Put a 'Y' in it's 'Enabled' column in the actions matrix spreadsheet to enable it.");
    		return false;
    	}
    	
    	var hideTag = action["hide tag"].trim()
    	
    	// Should we hide it because they've finished it and can't repeat?
		if (hideTag && ($.inArray(hideTag, c4c.user_tags) > -1)) {
			$log.info("Action hidden (slug:" + action["Slug"] + ") Reason: completed");
		
			return false;
		}

		// Does it have a corresponding page?
		var pageSlug = action["page slug"].trim()

		if (pageSlug && ($.inArray(pageSlug, c4c.action_pages) == -1)) {
			$log.error("action hidden (slug: " + action["Slug"] + ") Reason: no matching page. You must create a signup page that is a child of this page. The child page must have the slug: " + pageSlug);

			// If demoMode is set, show the action anyway for easy debugging
			if (c4c.demoMode) {
				$log.info("Running in demo mode, showing action anyway: " + pageSlug);
			}
			else {
				return false;
			}
		}
    	
    	return true;
    }  
    
    /**
      * Returns CSS classes for the action
      */
    function actionCSSClass(action) {
    	var htmlClass = '';
    
    	// Set done if it's been done
    	var done_tag = action["end tag"];
    	
    	if ($.inArray(done_tag, c4c.user_tags) > -1 ) {
			htmlClass += 'done';
		}
    	
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

/**
  * ActionListItemController
  *
  * $scope variables
  * * big	True if the element should expand
  */
function ActionListItemController($scope, Tabletop) {
	$scope.big = false;	
}

})();
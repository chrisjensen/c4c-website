'use strict';

(function() {

angular.module('c4cWebsite.actions')

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'actions_guide.html',
    controller: 'ActionsGuideController'
  });
  $routeProvider.when('/actions', {
    templateUrl: 'actions_grid.html',
    controller: 'ActionsGridController'
  });
  $routeProvider.when('/actions/:categoryName', {
    templateUrl: 'actions_list.html',
    controller: 'ActionsListController'
  });
}])

.controller('ActionFailForm', ['$scope', 'ActionService', ActionFailForm])
.controller('ActionSimpleSuccessForm', ['$scope', 'ActionService', ActionSimpleSuccessForm])
.controller('ActionCustomFieldsSuccessForm', ['$scope', '$log', 'ActionService', ActionCustomFieldsSuccessForm])

.controller('ActionsGridController', ['$scope', 'Tabletop', ActionsGridController])

.controller('ActionsListController', ['$scope', '$routeParams', '$log', 'Tabletop', ActionsListController])

.controller('ActionFlashController', ['$scope', 'ActionService', ActionFlashController])

.controller('ActionsGuideController', ['$scope', '$timeout', 'ActionService', ActionsGuideController])

.directive('actionShare', function ActionShareDirective() {
  return {
    restrict: 'E',
    templateUrl: 'action_share.html',
    controller:  ['$scope', '$log', 'Tabletop', ActionShareController],
    link: ActionShareLink
  }
})

.directive('actionCustomField', function ActionCustomFieldDirective() {
  return {
    restrict: 'E',
    templateUrl: 'action_custom_field.html',
    scope: { customField: '=' },
    controller:  ['$scope', '$log', ActionCustomFieldController],
  }
})

.directive('selectField', function SelectFieldDirective() {
  return {
    restrict: 'E',
    templateUrl: 'select_field.html',
    scope: { customField: '=' },
    controller:  ['$scope', '$log', SelectFieldController],
  }
})

.directive('actionListItem', function ActionsListItemDirective() {
  return {
    restrict: 'E',
    templateUrl: 'action_list_item.html',
    scope: { action: '=', big: '=' },
    controller:  ['$scope', '$log', '$timeout', ActionListItemController]
  }
})

.directive('actionSteps', function ActionStepsDirective() {
  return {
    restrict: 'A',
    controller:  ['$scope', '$log', ActionStepsController],
    link: ActionStepsLink
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
  * ActionsGuideController
  *
  * $scope variables
  * * action - The suggested action
  */
function ActionsGuideController($scope, $timeout, ActionService) {
	var suggestions = ["power", "super", "facilitate"];
	var suggestionsIndex = 0;
	var actions = [];

	$scope.nextAction = nextAction;

	$scope.hint = {
		name: 'changing their power',
		slug: 'power'
	}

	// Find our suggested action
	ActionService.then(function(actionList) {
		actions = actionList;
	
		loadAction();
	});
	
	function nextAction() {
		suggestionsIndex = (suggestionsIndex + 1) % suggestions.length;
	
		$scope.hint.slug = suggestions[suggestionsIndex];
		
		loadAction();
	}
	
	function loadAction() {
		// What action are we on
		var action = actions.findBySlug($scope.hint.slug);

		$scope.action = action;
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

		// Set the class for the action and other info on the action
		$scope.actions.forEach(function(action) {
			action["class"] = actionCSSClass(action);
			
			// Has the user done the action?
			action["isDone"] = ($.inArray(action["end tag"], c4c.user_tags) > -1);
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

		if (!(pageSlug && c4c.action_pages[pageSlug])) {
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
			htmlClass += ' done';
		}
    	
    	// Set the class for the category
    	htmlClass += ' act_cat_' + makeSafeForCSS(action["Category"]);
    	
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
  * Changes the form page_id to go to the corresponding action page
  *
  * $scope variables
  */
function ActionListItemController($scope, $log, $timeout) {
	setDestinationPage($scope.action);

	// Update the destination if the action updates
	$scope.$watch('action', function() {
		setDestinationPage($scope.action);
	});

	// Sets the destination page for this action. Only sets it if
	// action is present
	function setDestinationPage(action) {
		if (action) {
			// Timeout to give the DOM a chance to render so the
			// element can be found with the dynamic id
			$timeout(function() {
				var slug = action["Slug"],
					page_id = c4c.action_pages[action["page slug"].trim()];

				$('#act_' + slug).find("input[name='page_id']").attr('value', page_id);
			}, 0);
		}
	}
}

/**
  * ActionShareController
  *
  * $scope variables
  *		shareContentElement - The input that contains the text of the post
  */
function ActionShareController($scope, $log, Tabletop) {
	var default_share_text = "I'm taking this action on climate change ...";

	$scope.$watch('shareContentElement', function() {
		$($scope.shareContentElement).attr('value', default_share_text);
	});

	Tabletop.then(function(sheets) {
		// Find this category
		var actions = sheets[0]["Actions"].all();
		
		// Change the value of the tweet
//		$($scope.shareContentElement).attr('value', 'SHARE CONTENT');
	});
}

function ActionShareLink(scope, element, attributes) {
	scope.shareContentElement = $(element).find('#face_tweet_content');
}

/**
  * Sets the correct tag for failing
  *
  * $scope
  * * success_tag - The tag to be applied to the user if they succeed
  * * hasCustomFields - true if the action has custom fields
  */
function ActionSimpleSuccessForm($scope, ActionService) {
	ActionService.then(function(actions) {
		// Find the correct action
		var action = actions.findByPage(c4c.page_slug);
		
		$scope.action = action;
		
		// Set the tag to the done tag
		$scope.success_tag = action["end tag"];
		
		$scope.action.hasCustomFields = (action["Custom Fields"].trim() ? true : false );
	});
}

/**
  * ActionCustomFieldSuccessForm
  *
  * $scope
  * * success_tag - The tag to be applied to the user if they succeed
  * * hasCustomFields - True if the action has custom fields
  * * customFields - Array of the custom fields to display for this action
  */
function ActionCustomFieldsSuccessForm($scope, $log, ActionService) {
	ActionService.then(function(actions) {
		// Find the correct action
		var action = actions.findByPage(c4c.page_slug);
		
		$scope.action = action;
		
		// Set the tag to the done tag
		$scope.success_tag = action["end tag"];
		
		$scope.action.hasCustomFields = (action["Custom Fields"].trim() ? true : false );

		$scope.customFields = selectCustomFields(action,
			c4c.custom_fields);
	});
	
	function selectCustomFields(action, customFields) {
		var selectedFields = [];
		
		// Don't bother iterating through the fields if there are none
		if (action["Custom Fields"].trim()) {
			// Split the custom field list on commas or white space
			var cfList = action["Custom Fields"].trim().split(/[ ,]+/);

			angular.forEach(cfList, function(slug) {
				if (customFields[slug]) {
					selectedFields.push(customFields[slug]);
				} else {
					$log.error('Missing custom field. Tried to display custom field but there is no custom field in Nation Builder with that slug: ' + slug);
				}
			});
		}
	
		return selectedFields;
	}
}

/**
  * Sets the correct tag for failing
  * $scope
  * * fail_tag - The tag to be applied to the user if they give up
  */
function ActionFailForm($scope, ActionService) {
	ActionService.then(function(actions) {
		// Find the correct action
		var action = actions.findByPage(c4c.page_slug);
		
		// Set the tag to the giveup tag
		$scope.fail_tag = action["giveup tag"];
	});
	
	// Set the page_id = 151 (action_problem)
	var problem_page_id = '151';
	
	// Set the page_id for failure
	$('#fail_form').find("input[name='page_id']").attr('value', problem_page_id);
}

/**
  * Hides/unhides the flash message in case it was displayed by accident
  *
  * Since we arrive on this page from a signup form (so as to tag the user as
  * having started the action) NationBuilder will display a flash saying thankyou
  * for signing up.
  * This controller will show the flash if:
  *	  * the user has been tagged as having done the action associated with this 
  *   * page
  *
  * $scope
  *	*	showFlash - True if the flash should be shown
  */
function ActionFlashController($scope, ActionService) {
	// Hide until we figure out if they've done this
	$scope.showFlash = false;

	ActionService.then(function(actions) {
		// What action are we on
		var action = actions.findByPage(c4c.page_slug);
		
		// If they've done it, then unhide
		var doneTag = action["end tag"];
		if (doneTag && ($.inArray(doneTag, c4c.user_tags) > -1)) {
		  $scope.showFlash = true;
		}
	});
}

/**
  * ActionSetpsLink
  * Links the controller to the element it's tagged on 
  */
function ActionStepsLink(scope, element, attributes) {
	scope.element = $(element);
}

/**
  * Attribute for steps to help write the code to
  * make dynamic functions work (like collapse)
  */
function ActionStepsController($scope, $log) {

	// Once link function has found our element
	// go through and link up the collapse directives
	$scope.$watch('element', function() {
		// Set up the accordion collapse on the steps
		var steps = $scope.element.find('.step-heading');

		steps.attr('data-toggle', 'collapse');
		steps.attr('data-parent', '#steps');

		steps.each(function() {
			var step = $(this);
			var id = step.attr('id');
			var target = '#' + id.replace('heading', 'details');
			step.attr('data-target', target);
		});

		var collapses = $scope.element.find('.toggle-collapse');
		collapses.attr('data-toggle', 'collapse');

		collapses.each(function() {
			var step = $(this);
			var id = step.attr('id');
			var target = '#' + id.replace('heading', 'details');
			step.attr('data-target', target);
		});
	});
}

/**
  * Display a custom field element
  * $scope
  * * customField - The custom field to display
  */
function ActionCustomFieldController($scope, $log) {
}

/**
  * Display a select field
  * $scope
  * * choices - Array of choices of the form
  *				[ { id: "value", name: "display name" }, ... ]
  */
function SelectFieldController($scope, $log) {
	$scope.choices = $scope.customField.choices;
}

})();
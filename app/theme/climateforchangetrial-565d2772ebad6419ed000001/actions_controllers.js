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
  $routeProvider.when('/season/:seasonSlug', {
    templateUrl: 'actions_guide.html',
    controller: 'ActionsGuideController'
  });
}])

.controller('ActionFailForm', ['$scope', 'ActionService', ActionFailForm])
.controller('ActionSimpleSuccessForm', ['$scope', 'ActionService', ActionSimpleSuccessForm])
.controller('ActionCustomFieldsSuccessForm', ['$scope', '$log', 'ActionService', ActionCustomFieldsSuccessForm])

.controller('ActionsGridController', ['$scope', 'Tabletop', ActionsGridController])

.controller('ActionsListController', ['$scope', '$routeParams', '$log', 'ActionService', ActionsListController])

.controller('ActionFlashController', ['$scope', 'ActionService', ActionFlashController])

.controller('ActionsGuideController', ['$scope', '$routeParams', '$log', 'ActionService', ActionsGuideController])

.controller('ActionButtonController', ['$scope', '$uibModal', ActionButtonController])

.controller('LoginModalController', ['$scope', 'action', LoginModalController])

.directive('actionShare', function ActionShareDirective() {
  return {
    restrict: 'E',
    templateUrl: 'action_share.html',
    controller:  ['$scope', '$log', ActionShareController],
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

.directive('actionsReminder', function ActionsReminderDirective() {
  return {
    restrict: 'E',
    controller:  ['$scope', '$log', '$routeParams', 'ActionService', ActionsReminderController],
    templateUrl: 'actions_reminder.html',
  }
})

.directive('actionSeason', function ActionSeasonDirective() {
  return {
    restrict: 'E',
    controller:  [ActionSeasonController],
    templateUrl: 'action_season.html',
  }
})

.directive('actionUnfinished', function ActionUnfinishedDirective() {
  return {
    restrict: 'E',
    controller:  [ActionUnfinishedController],
    templateUrl: 'action_unfinished.html',
  }
})

.directive('actionButton', function ActionButtonDirective() {
  return {
    restrict: 'E',
    scope: { action: '=' },
    controller:  ['$scope', '$uibModal', ActionButtonController],
    templateUrl: 'action_button.html',
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
  * * title	 - Title (if any) to display
  * * description - Description to display
  * * loaded - True when guide has loaded
  * * finishedAll - True if the user has finished all suggestions
  * * season - The season, if any, being guided through
  */
function ActionsGuideController($scope, $routeParams, $log, ActionService) {
	var suggestions = [];
	var suggestionsIndex = 0,
		seasonSlug = $routeParams.seasonSlug;

	$scope.nextAction = nextAction;

	$scope.title = "";
	$scope.name_or_email = (c4c.user ? c4c.user.name_or_email : '');
	$scope.description = "Your suggested action for this week:";

	// Load up the guides
	ActionService.then(function(actionSheet) {
		var slugList = [];
		
		// If a season was specified, show the guide for that season
		if (seasonSlug) {
			$log.debug('Displaying guide for season: ' + seasonSlug);
		
			var season = actionSheet.findSeasonBySlug(seasonSlug);
			$scope.title = season['Title'];
			$scope.description = season['Notice'];
			$scope.season = season;
			
			// Convert the action slugs into an array
			var slugList = season["Action Slugs"].trim().split(/[ ,]+/);

			suggestions = actionSheet.actionsFromSlugs(slugList, season, true);
		
		// Otherwise use the default guide
		} else {
			slugList = actionSheet.defaultGuide();
			suggestions = actionSheet.actionsFromSlugs(slugList, null, true);
		}
		
		$scope.loaded = true;
		$scope.finishedAll = (suggestions.length == 0);
		
		loadAction();
	});
	
	// Advance to next action
	function nextAction() {
		suggestionsIndex = (suggestionsIndex + 1) % suggestions.length;
	
		loadAction();
	}
	
	// Put selected action on the scope
	function loadAction() {
		// What action are we on
		var action = suggestions[suggestionsIndex];

		$scope.action = action;
	}
}

/**
  * ActionButtonController
  * Provides method to launch a login modal if the user is not logged in
  * *scope*
  *	* login - Method to launch a modal, requires the action be passed to it
  */
function ActionButtonController($scope, $uibModal) {
	$scope.login = login;
	
	var modalInstance,
		modalScope = $scope.$new();
	
	modalScope.dismiss = dismiss;

	function login(action) {
		modalInstance = $uibModal.open({
		  templateUrl: 'login_modal.html',
		  controller: 'LoginModalController',
		  scope: modalScope,
		  resolve: {
			action: function(){
			  return action;
			}
		  }
		});		
	}
	
	function dismiss() {
		modalInstance.dismiss('cancel');
	}
}

/**
  * Controller for Login Modal
  * *scope*
  * * action - The action that the user wants to go to
  * * state - the current state of the modal, 
  *			used to allow multiple panes to be shown in one modal using button clicks
  **/
function LoginModalController($scope, action) {
	$scope.state = 'main';
	$scope.action = action;
	
	$scope.setState = setState;
	
	function setState(s) {
		$scope.state = s;
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
function ActionsListController($scope, $routeParams, $log, ActionService) {
	var vm = this,
		categoryName = $routeParams.categoryName;

	$scope.actions = [];
	$scope.loaded = false;
	
	$scope.category = {
		Name: categoryName
	};
	
	// Once spreadsheet is loaded
	ActionService.then(function(actionSheets) {
		// Put category details on the scope
		$scope.category = actionSheets.findCategory(categoryName);

		// Get the actions in the category
		$scope.actions = actionSheets.actionsInCategory(categoryName);

		// Set the class for the action and other info on the action
		$scope.actions.forEach(function(action) {
			action["class"] = actionCSSClass(action);
			
			// Has the user done the action?
			action["isDone"] = ($.inArray(action["end tag"], c4c.user_tags) > -1);
		});
		
		// We're good to go
		$scope.loaded = true;
	});
	
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
					page_id = action["Page ID"];

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
function ActionShareController($scope, $log) {
	var default_share_text = "I'm taking this action on climate change ...";

	$scope.$watch('shareContentElement', function() {
		$($scope.shareContentElement).attr('value', default_share_text);
	});
}

function ActionShareLink(scope, element, attributes) {
	scope.shareContentElement = $(element).find('#face_tweet_content');
}

/**
  * Sets the correct tag for success
  *
  * $scope
  * * success_tag - The tag to be applied to the user if they succeed
  * * hasCustomFields - true if the action has custom fields
  */
function ActionSimpleSuccessForm($scope, ActionService) {
	$scope.name_or_email = (c4c.user ? c4c.user.name_or_email : '');

	ActionService.then(function(actions) {
		// Find the correct action
		var action = actions.findUnfinishedAction(c4c.page_slug);
		
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
		var action = actions.findUnfinishedAction(c4c.page_slug);
		
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
		var action = $scope.action || actions.findUnfinishedAction(c4c.page_slug);
		
		// Set the tag to the giveup tag
		$scope.fail_tag = action["giveup tag"];
	});
	
	// Set the page_id = 151 (action_problem)
	var problem_page_id = '151';
	
	// Set the page_id for failure
	$('.fail_form').find("input[name='page_id']").attr('value', problem_page_id);
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
		var finished = actions.isPageActionFinished(c4c.page_slug, c4c.user_tags);
		
		if (finished) {
		  $scope.showFlash = true;
		}
	});
}

/**
  * ActionStepsLink
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
  * ActionsReminderController
  *
  * $scope
  * show - What to display: false, season or unfinished
  * season - season to display
  * action - unfinished action to display
  */
function ActionsReminderController($scope, $log, $routeParams, ActionService) {
	$scope.show = false;
	
	ActionService.then(function(actions) {
		$scope.$on('$routeChangeSuccess', function(next, current) {
			displayReminder(actions);
		});
		
		displayReminder(actions);
	});

	function displayReminder(actions) {
		// Check if this is a page that the reminder should be shown on
		if (canShowReminder()) {
			// Do they have incomplete actions??
			var incompleteActions = actions.unfinishedActions();
			
			if (incompleteActions.length) {
				$scope.action = incompleteActions[0];
				$scope.show = 'unfinished';
			} else {
				var unfinishedSeasons = actions.unfinishedSeasons();
			
				if (unfinishedSeasons.length) {
					// Suggest seasonal action
					$scope.season = unfinishedSeasons[0];
					
					// Don't hint at this season if they're looking at it
					if ($routeParams.seasonSlug != $scope.season['Slug']) {
						$scope.show = 'season';
					} else {
						$scope.show = false;
					}
				}
			}
		}
	}
	
	function canShowReminder(config) {
		var canShow = true,
			atLeastOneRule = false;
		/*
		for (i=0; i<config.length(); i++) {
			var row = config[i];
			
			if (row['Page type'].trim() && (c4c.page_type == row['Page type'])) {
				if (row['Rule'] == 'Include')
					canShow = canShow && true;
				else if (row['Rule'] == 'Exclude')
					// Stop here, it's been explicitly excluded
					return false;
			}
			
			if (row['Page tags'].trim()) {
				
			
			  for (j=0; j
			   && (c4c.page_tags == row['Page tags'])) {
				if (row['Rule'] == 'Include')
					canShow = canShow && true;
				else if (row['Rule'] == 'Exclude')
					// Stop here, it's been explicitly excluded
					return false;
			}
					
		// Inclusions
		// page type
		// page tags
		// page slug

		// Inclusions
		// page type
		// page tags
		// page slug
		}*/
		
		return (c4c.page_slug == "actions");
	}
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

function ActionUnfinishedController() {
}
function ActionSeasonController() {
}

})();
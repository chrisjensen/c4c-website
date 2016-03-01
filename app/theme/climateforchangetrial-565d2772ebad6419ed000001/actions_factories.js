(function() {
	angular.module('c4cWebsite.actions')
	.factory('ActionService', ['$q', '$log', 'Tabletop', actionService]);
	
	/**
	  * Returns a promise when the action service is loaded
	  */
	function actionService($q, $log, Tabletop) {
		var service = init(),
			actionSheet,
			allSheets;
		
		return service;

		function init() {
			var service = {
				findBySlug: findBySlug,
				findByPage: findByPage,
				guide: guide,
				findCategory: findCategory,
				actionsInCategory: actionsInCategory
			}
			
			var deferred = $q.defer();			

			$log.debug('Actions are configured in: ' + c4c.actions_spreadsheet);

			Tabletop.then(function(TabletopSheets) {
				allSheets = TabletopSheets[0];
				actionSheet = TabletopSheets[0]["Actions"].all();
			
				deferred.resolve(service);
			});

			return deferred.promise;
		};

	/**
	  * Find an action by slug
	  */
	function findBySlug(slug) {
		for (var i=0; i<actionSheet.length; i++) {
			var row = actionSheet[i];
			
			if (row["Slug"] == slug)
			  return row;
		}
		
		$log.error('Could not find action with slug: ' + slug);
	};
	
	/**
	  * Find an action by slug
	  */
	function findByPage(page) {
		for (var i=0; i<actionSheet.length; i++) {
			var row = actionSheet[i];
			
			if (row["page slug"] == page)
			  return row;
		}

		$log.error('Could not find action for page: ' + page);
	};
	
	/**
	  * Return an array of all the actions in a particular category
	  */
	function actionsInCategory(categoryName) {
		// Get the Actions table
		var actions = actionSheet;
		
		// Filter actions for this category
		actions = $.grep(actions, function(action) {
			return (action["Category"] == categoryName);
		});
		
		// Remove any actions that we can't show
		actions = $.grep(actions, canShow);

		return actions;
	}
	
	/**
	  * Return the details of the selected category
	  */
	function findCategory(name) {
		// Find this category
		var table = allSheets["Categories"];
		var category = $.grep(table.all(), function(cat){
			return (cat.Name == name);
		}).shift();
		
		if (!category) {
			$log.error('Could not find category: ' + name);
		}
		
		return category;
	}
	
	/**
	  * Returns an array of actions to display as a guide for the user, in order they should be suggested
	  */
	function guide() {
		var actions = [],
			guideSheet = allSheets["Guide"].all();
		
		for (var i=0; i<guideSheet.length; i++) {
			var slug = guideSheet[i]["Slug"];
			
			var action = findBySlug(slug);
			
			if (action && canShow(action)) {
				actions.push(action);
			}
		}		
	
		return actions;
	};
	
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
			$log.error("action is broken (slug: " + action["Slug"] + " title: " + action["Title"] + ") It must have a slug and title in the actions matrix spreadsheet.");

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
		var pageSlug = action["page slug"].trim();
		
		var slugIsGood = ((pageSlug && c4c.action_pages[pageSlug]) ||
									 action["Ignore Page Missing"] == "Y");

		if (! slugIsGood) {
			$log.error("action hidden (slug: " + action["Slug"] + ") Reason: no matching page (did you set it's status to published?). You must create a signup page that is a child of this page. The child page must have the slug: " + pageSlug);
			
			$log.debug("If the page is located elsewhere (eg host, facilitate), put a Y in the 'Ignore Page Missing' column to force this action to show");

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
	};
})();
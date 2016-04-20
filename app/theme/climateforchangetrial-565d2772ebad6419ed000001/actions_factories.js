(function() {
	angular.module('c4cWebsite.actions')
	.factory('ActionService', ['$q', '$log', 'Tabletop', actionService]);
	
	/**
	  * Returns a promise when the action service is loaded
	  */
	function actionService($q, $log, Tabletop) {
		var svc = init(),
			actionSheet,
			configuration,
			allSheets;
		
		return svc;

		function init() {
			var service = {
				findBySlug: findBySlug,
				findByPage: findByPage,
				findCategory: findCategory,
				findSeasonBySlug: findSeasonBySlug,
				defaultGuide: defaultGuide,
				actionsInCategory: actionsInCategory,
				findActionByStartTag: findActionByStartTag,
				allActiveSeasons: allActiveSeasons,
				unfinishedActions: unfinishedActions,
				unfinishedSeasons: unfinishedSeasons,
				actionsFromSlugs: actionsFromSlugs,
				config: config,
				badgesForUser: badgesForUser
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
	function findBySlug(slug, season) {
		for (var i=0; i<actionSheet.length; i++) {
			var row = actionSheet[i];
			
			if (row["Slug"] == slug) {
			  if (season) {
			  	row = applySeason(row, season);
			  }
			  return row;
			}
		}
		
		$log.error('Could not find action with slug: ' + slug);
	};
	
	/**
	  * Find an action by slug
	  */
	function findByPage(page) {
		for (var i=0; i<actionSheet.length; i++) {
			var row = actionSheet[i];
			
			if (row["page slug"] == page) {
			  return withinSeason(row);
			}
		}

		$log.error('Could not find action for page: ' + page);
	};
	
	/**
	  * Find an action by start tag
	  */
	function findActionByStartTag(tag, season) {
		for (var i=0; i<actionSheet.length; i++) {
			var row = season ? applySeason(actionSheet[i], season) : actionSheet[i];
			
			if (row["start tag"] == tag) {
			  return row;
			}
		}

		$log.error('Could not find action with start tag: ' + tag);
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

		// Add page ids for all possible
		$.each(actions, function(index, action) {
			addPageId(action)
		});
		
		// Remove any actions that we can't show
		actions = $.grep(actions, canShow);
		
		return actions;
	}
	
	/**
	  * Add a pageId to the action if it doesn't already have one
	  * and if one can be found from it's slug
	  */
	function addPageId(action) {
		var pageSlug = action["page slug"];
	
		action["Page ID"] = action["Page ID"].trim();
	
		if (pageSlug && (!action["Page ID"])) {
			if (c4c.action_pages[pageSlug]) {
				action["Page ID"] = c4c.action_pages[pageSlug];
			}
		}
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
	  * Returns the slugs to display as a default guide for the user
	  * Taken from the Slug column of the Guide sheet
	  */
	function defaultGuide() {
		var actions = [],
			guideSheet = allSheets["Guide"].all();
		
		for (var i=0; i<guideSheet.length; i++) {
			actions.push(guideSheet[i]["Slug"]);
		}		
	
		return actions;
	};
	
	/**
	  * Finds a season by slug
	  */
	function findSeasonBySlug(slug) {
		var	seasonSheet = allSheets["Seasonal Actions"].all();

		for (var i=0; i<seasonSheet.length; i++) {
			var row = seasonSheet[i];
			
			if (row["Slug"] == slug)
			  return row;
		}
		
		$log.error('Could not find season with slug: ' + slug);
	}
	
	/**
	  * Returns an array of actions from an array of slugs
	  * slugList - The array of slugs to search
	  * season - The slug of the season, if any, the slugs are from
	  * hideDone - Don't include actions that have been completed/givenup
	  */
	function actionsFromSlugs(slugList, season, hideDone) {
		var actions = [];
	
		for (var i=0; i<slugList.length; i++) {
			var action = findBySlug(slugList[i], season);

			// Add page ids if possible
			addPageId(action)
			
			// Add the action if
			// + it can be found
			// + it can be shown
			// + it should be suggested
			if (action && canShow(action)) {
			  if (!hideDone || shouldSuggest(action)) {
				actions.push(action);
			  }
			}
		}
		
		return actions;
	};
	
	/**
	  * Should this action be suggested?
	  * 
	  * Returns false if the action has been completed or given up on
      */
	function shouldSuggest(action) {
    	// Set done if it's been done
    	var done_tag = action["end tag"],
    		giveup_tag = action["giveup tag"];
    	
    	if ($.inArray(done_tag, c4c.user_tags) > -1 ) {
    		$log.debug("Action finished: " + action["Slug"] + ". (user tagged with: " + 
    			done_tag + ") Won't suggest it.");
    		return false;
		}
		
    	if ($.inArray(giveup_tag, c4c.user_tags) > -1 ) {
    		$log.debug("Action given up on: " + action["Slug"] + "(user tagged with: " + 
    			giveup_tag + ") Won't suggest it.");
    		return false;
		}
		
		return true;
	}
	
	/**
	  * Adapts the action to be within a season if it was already started within a
	  * season
	  */
	function withinSeason(action) {
		// Find list of seasons with action
		var seasons = allActiveSeasons();
		
		for (var i=0; i<seasons.length; i++) {
			if (isActionInSeason(action, seasons[i])) {
		
				seasonalAction = applySeason(action, seasons[i])

				// Has the user started but not completed the seasonal version of this action?			
				if (isActionIncomplete(seasonalAction)) {
					return seasonalAction;
				}
			}
		}
		
		return action;
	}
	
	/**
	  * Return an array of all active seasons
	  */
	function allActiveSeasons() {
		var	seasonSheet = allSheets["Seasonal Actions"].all();
		
		var activeSeasons = [], 
			now = moment();

		// For all seasons
		for (var i=0; i<seasonSheet.length; i++) {
			var row = seasonSheet[i];

			// Get start and end time
			var start = moment(row['Start Date'], "DD/MM/YYYY").startOf('day');
			var end = moment(row['End Date'], "DD/MM/YYYY").endOf('day');

			// If we're within that time
			if (now.isBetween(start, end)) {
				activeSeasons.push(row);
			}
			
			// If we're in demo mode, show make the first season active
			if (isDemoMode()) {
				$log.debug('Demo mode: Making first season active anyway. Slug: ' + row["Slug"]);

				activeSeasons.push(row);
			}
		}
		
		return activeSeasons;
	}
	
	/**
	  * Returns true if the season contains the action
	  */
	function isActionInSeason(action, season) {
		return ($.inArray(action['Slug'], season['Action Slugs'].split(/[ ,]+/)) > -1);
	}

	/**
	  * Returns a copy of action with the season applied to it
	  *
	  * Only makes changes if start, end and giveup tags follow the standard convention
	  * to avoid messing up non-standard actions / tags
	  */	
	function applySeason(action, season) {
		// Only apply the season if the start, end and give up tags are as expected
		var pageSlug = action['page slug'];
		var expectedTags = pageSlug + "_start" + pageSlug + "_done" + pageSlug + "_giveup";
		var	actualTags = action['start tag'] + action['end tag'] + action['giveup tag'];
		
		if (expectedTags == actualTags) {
			// Clone the action so as not to destroy the original
			action = jQuery.extend(true, {}, action);
		
			// Change slugs
			action['start tag'] = season['Slug'] + '_' + action['Slug'] + '_start';
			action['end tag'] = season['Slug'] + '_' + action['Slug'] + '_done';
			action['giveup tag'] = season['Slug'] + '_' + action['Slug'] + '_giveup';
		}
		
		return action;
	};
	
	/**
	  * Returns true if an action has been started, but not given up on or finished
	  * action - The action to check
	  * tags - (Optional) The tags to check (will use c4c.user_tags otherwise)
	  */
	function isActionIncomplete(action, tags) {
		tags = tags || c4c.user_tags;
	
		// Can we find start tag, but neither end or giveup tag?
		return (($.inArray(action['start tag'], tags) > -1) && 
				(($.inArray(action['end tag'], tags) == -1) &&
				($.inArray(action['giveup tag'], tags) == -1)));
	};
	
	/**
	  * Returns true if an action has been started, and given up on or finished
	  * action - The action to check
	  * tags - (Optional) The tags to check (will use c4c.user_tags otherwise)
	  **/
	function isActionComplete(action, tags) {
		tags = tags || c4c.user_tags;
	
		// Can we find start tag, and either end or giveup tag?
		return (($.inArray(action['start tag'], tags) > -1) && 
				(($.inArray(action['end tag'], tags) > -1) ||
				($.inArray(action['giveup tag'], tags) > -1)));
	};


	/**
	  * Returns an array of unfinished actions
	  * Ignores actions with non-standard tag naming
	  */
	function unfinishedActions() {
		var actions = [];

		// Get list of seasons, ordered by soonest expiring
		var seasons = allActiveSeasons().sort(function(a,b) {
			am = moment(a["End Date"], "DD/MM/YYYY");
			bm = moment(b["End Date"], "DD/MM/YYYY");
			
			return am.isSame(bm) ? 0 : (am.isBefore(bm) ? -1 : 1)
		});
		
		// Also search the normal actions
		seasons.push('act_');
		
		for (var i=0; i<seasons.length; i++) {
		  for (var j=0; j<c4c.user_tags.length; j++) {
		    var tag = c4c.user_tags[j], 
		    
		    	// Tag prefix will be act_ or seasons slug
		    	prefix = ((seasons[i] == 'act_') ? 'act_' : (seasons[i]["Slug"] + "_"));

			// Does this tag start with the prefix of this season (or act_)
		    if (tag.lastIndexOf(prefix,0) != -1) {
		    	
		    	// Don't bother examining tags with the suffix _done or _giveup
		    	if ((tag.lastIndexOf('_done', tag.length - 1) == -1 ) &&
		    		 (tag.lastIndexOf('_giveup', tag.length - 1) == -1)) {
				
					var action = ((prefix == 'act_') ? findActionByStartTag(tag) : 
									findActionByStartTag(tag, seasons[i]))

					if (action && isActionIncomplete(action)) {
						actions.push(action);
					}
			    }
			}
		  }
		}

		return actions;
	}
	
	/**
	  * Returns array. Currently array only contains first unfinished season
	  */
	function unfinishedSeasons() {
		var seasons = [];
		
		var allSeasons = allActiveSeasons();
		
		for (var i=0; i<allSeasons.length; i++) {
		  var season = allSeasons[i];
		  var actionSlugs = season['Action Slugs'].split(/[ ,]+/);

		  for (var j=0; j<actionSlugs.length; j++) {
			// If the season contains an action that the user hasn't done
			
			action = findBySlug(actionSlugs[j], season);
			
			if (!isActionComplete(action)) {
			  seasons.push(season);
			  return seasons;
			}
		  }
		}
		  
		return seasons;
	}
	
	/** 
	  * Return the Settings sheet as a map
	  */
	function config() {
		if (!configuration) {
			var	configSheet = allSheets["Settings"].all();
		
			// Turn it into a map
			configuration = {};
			
			for (var i=0; i<configSheet.length; i++) {
				var setting = configSheet[i];
				configuration[setting['Name']] = setting['Value'];
			}
		}
		
		return configuration;
	}

    /**
      * getAllDoneTags
      * Map all done tags into 
      * {
      *   "done_tag" : {
      *			seasonTitle: "",
      *			badgeName: "",
      *			pageSlug: ''
      *		}
      * }
      */
	function getAllDoneTags() {
		var	seasonSheet = allSheets["Seasonal Actions"].all();
		
		var doneTags = {};

		// Clone seasons
		var seasons = seasonSheet.slice();

		// Add non-seasonal action to the seasons list
		seasons.push({
			'Slug' : null,
			'Badge Title' : 'Other Actions'
		});

		// Put all actions into a done tags map
		for (var i=0; i<seasons.length; i++) {
			var season = seasons[i];
			
			var actions;
			
			// If it's the "everything" group
			if (season['Slug'] == null) {
				actions = actionSheet;
			
				// Add page ids for all possible
				$.each(actions, function(index, action) {
					addPageId(action)
				});

				// Get all showable actions from the actionSheet
				actions = $.grep(actions, canShow);
			} else {
				// Otherwise find all actions in that season
				actions = actionsFromSlugs(season['Action Slugs'].split(/[ ,]+/),
							season);
			}
			
			for (var j=0; j<actions.length; j++) {
				var action = actions[j];
			
				// Create map
				doneTags[action['end tag']] = {
					season: season,
					badgeName: action['Badge'],
					pageSlug: action['page slug']
				};
			}
		}
		
		return doneTags;
	}

    /**
      * Returns all the badges for a user
      * in the form
      * [
      *		{ season: {
      *				'Slug': ...
      *			},
      *		  badges: [
      *				{
      *					badgeName: ...
      *					pageSlug: ...
      *				}
      *			]
      *     }
      * ]
      */
	function badgesForUser(userTags) {
		
		var doneTagsMap = getAllDoneTags();
		
		var badges = [];

		// Apply tags and seasons in the order they appear
		for (var doneTag in doneTagsMap) {
		  if (doneTagsMap.hasOwnProperty(doneTag)) {
		  	// Has the user been tagged?
			if ($.inArray(doneTag, userTags) > -1 ) {
			  var badge = doneTagsMap[doneTag];
			  
			  // Does the tag have a badge?
			  if (badge['badgeName']) {
			    // Is this season already in the users list?
			    if ((badges.length == 0) ||
			     (badges[badges.length - 1]['season']['Slug'] !=   badge['season']['Slug'])) {
			    	badges.push({
			    		season: badge['season'],
			    		badges: []
			    	});
			    }
			    
			    // Add the tag to the season
			    badges[badges.length - 1]['badges'].push(badge);
			  }
			}
		  }
		}

		return badges;
	}
	
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
		
		var slugIsGood = (pageSlug && action["Page ID"]);

		if (! slugIsGood) {
			$log.error("action hidden (slug: " + action["Slug"] + ") Reason: no matching page (did you set it's status to published?). You must create a signup page that is a child of this page. The child page must have the slug: " + pageSlug);
			
			$log.debug("If the page is located elsewhere (eg host, facilitate), put the ID number of the page in the Page ID column to force this action to show");

			// If demoMode is set, show the action anyway for easy debugging
			if (isDemoMode()) {
				$log.info("Running in demo mode, showing action anyway: " + pageSlug);
			}
			else {
				return false;
			}
		}
    	
    	return true;
    }  
	};
	
	function isDemoMode() {
		if ($.isNumeric(c4c.demo_mode)) {
			return (c4c.user) && (c4c.demo_mode == c4c.user.id);
		}
	}
})();
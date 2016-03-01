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
				guide: guide
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
	  * Returns an array of actions to display as a guide for the user, in order they should be suggested
	  */
	function guide() {
		var slugs = [],
			guideSheet = allSheets["Guide"].all();
		
		for (var i=0; i<guideSheet.length; i++) {
			var slug = guideSheet[i]["Slug"];
			
			if (canShow(slug)) {
				var action = findBySlug(slug);
				
				if (action) {
					slugs.push(action);
				}
			}
		}		
	
		return slugs;
	};
	
	function canShow(slug) {
		return true;
	}

	};
})();
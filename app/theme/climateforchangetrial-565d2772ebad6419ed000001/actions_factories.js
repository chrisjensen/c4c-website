(function() {
	angular.module('c4cWebsite.actions')
	.factory('ActionService', ['$q', '$log', 'Tabletop', actionService]);
	
	/**
	  * Returns a promise when the action service is loaded
	  */
	function actionService($q, $log, Tabletop) {
		var service = init(),
			actionSheet;
		
		return service;

		function init() {
			var service = {
				findBySlug: findBySlug,
				findByPage: findByPage,
			}
			
			var deferred = $q.defer();			

			Tabletop.then(function(TabletopSheets) {
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

	};
})();
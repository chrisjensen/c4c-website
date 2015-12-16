(function() {
	angular.module('c4cWebsite.actions')
	.factory('ActionService', ['$q', 'Tabletop', actionService]);
	
	/**
	  * Returns a promise when the action service is loaded
	  */
	function actionService($q, Tabletop) {
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
		angular.forEach(actionSheet, function(row) {
			if (row["Slug"] == slug)
			  return row;
		});
	};
	
	/**
	  * Find an action by slug
	  */
	function findByPage(page) {
		angular.forEach(actionSheet, function(row) {
			if (row["page slug"] == page)
			  return row;
		});
	};

	};
})();
'use strict';

/**
  * Controllers for displaying badges on the users profile page
  */

(function() {

angular.module('c4cWebsite.badges')

.directive('badgesList', function BadgesListDirective() {
  return {
    restrict: 'E',
    templateUrl: 'badges_list.html',
    controller:  ['$scope', '$log', 'ActionService', BadgesListController]
  }
})

.directive('badgeSeason', function BadgeSeasonDirective() {
  return {
    restrict: 'E',
    templateUrl: 'badge_season.html',
    controller:  [BadgeSeasonController]
  }
});

/**
  * BadgesListController
  *
  * Puts an array of badges that the user has earned on the scope
  *
  * $scope variables
  * * showBadges  True if badges are ready to be shown
  * * badges	  array of badges the current user has earned of the form:
  *     [{
  *			season: {
  *				pageSlug: ...
  *					},
  *			badges: [
  *			{ 
  *				Badge: 'Label of the Badge'
  *				Description: 'Description of the badge'
  *			}
  *		}, ...]
  */
function BadgesListController($scope, $log, ActionService) {
	$scope.badges = {};
	
	ActionService.then(function(actionSheet) {
		$scope.showBadges = showBadges(actionSheet.config(), c4c.profile_tags);
	
		// Don't bother loading badges unless we're going to show them
		if ($scope.showBadges) {
			var badges = actionSheet.badgesForUser(c4c.profile_tags);

			// Add a page slug so that we can link to where they can go
			for (var i=0; i < badges.length; i++) {
				var season = badges[i]['season'];
			
				season['pageSlug'] = season['Slug'] ? 'actions#/season/' + season['Slug'] : 'actions';
			}

			// Hide badges it there are no badges to show
			if (badges.length > 0) {
				$scope.badges = badges;
			} else {
				$scope.showBadges = false;
			}
		}
	});
	
	/*
	 * Return true unless a hide tag in the config is present on the profile tag
	 */
	function showBadges(config, profileTags) {
		var hideTags = config['Hide Badges if Tagged'].split(', ');
	
		for (var i=0; i<hideTags.length; i++) {
			if (hideTags[i]) {
				// Is the tag present?
				if ($.inArray(hideTags[i], profileTags) > -1) {
				  $log.info('Not showing badges because user is tagged: ' + hideTags[i]);
				  $log.info('Configure which tags hide badges in the Settings tab of the actions matrix spreadsheet');
				
				  return false;
				}
			}
		}
		
		return true;
	}
}

/**
  * BadgeSeasonController
  * Empty controller, no functionality needed, just custom template
  */
function BadgeSeasonController() {
};

})();

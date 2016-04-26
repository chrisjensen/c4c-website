'use strict';

/**
  * Facilitator module
  *
  * Used to render dynamic content on the /facilitator_admin page
  */

(function() {

angular.module('c4cWebsite.facilitator')

.directive('facilitatorAdmin', function FacilitatorAdminDirective() {
  return {
    restrict: 'A',
    controller:  ['$scope', '$log', FacilitatorAdminController],
  }
});

/**
  * Facilitator Admin Controller
  *
  * $scope
  * * transactionReference - The reference code for facilitator cash transactions
  */
function FacilitatorAdminController($scope, $log) {
	$scope.transactionReference = 'Gath' +
		c4c.user.first_name.charAt(0).toUpperCase() +
		c4c.user.last_name.charAt(0).toUpperCase() +
		c4c.user.id;
}

})();

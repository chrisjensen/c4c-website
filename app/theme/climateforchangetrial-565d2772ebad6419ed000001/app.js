'use strict';

angular.module('c4cWebsite.actions', ['ngRoute', 'times.tabletop']);

// Declare app level module which depends on views, and components
angular.module('c4cWebsite', [
  'ngRoute',
  'ngAnimate',
  'c4cWebsite.actions'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/'});
}]).

config(function(TabletopProvider){
	var spreadsheetUrl = c4c.actions_spreadsheet;

	// Configure the address of the Spreadsheet to use
	TabletopProvider.setTabletopOptions({
	  key: spreadsheetUrl + '/pubhtml',
	  simpleSheet: false
	  
	});
})
.config(function($interpolateProvider){
	// Change the default angular escape code as this clashes with liquid and
	// causes all our inlines to disappear
    $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
});
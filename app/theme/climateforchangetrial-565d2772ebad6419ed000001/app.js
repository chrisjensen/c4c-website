'use strict';

angular.module('c4cWebsite.actions', ['ngRoute', 'times.tabletop']);

// Declare app level module which depends on views, and components
angular.module('c4cWebsite', [
  'ngRoute',
  'c4cWebsite.actions'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/'});
}]).

config(function(TabletopProvider){
	// Configure the address of the Spreadsheet to use
	TabletopProvider.setTabletopOptions({
	  key: 'https://docs.google.com/spreadsheets/d/1PYC-NIMnCePaeWcCFsP5v-5YBQ1R2o6qu7quw6j784g/pubhtml',
	  simpleSheet: false
	  
	});
})
.config(function($interpolateProvider){
	// Change the default angular escape code as this clashes with liquid and
	// causes all our inlines to disappear
    $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
});
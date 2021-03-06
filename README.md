# Climate for Change Website
This project holds code for dynamic sections of the Climate for Change website that make use of AngularJS.

At the moment this is the following pages:

* /actions - The actions index page
* /act_* - Action instructions
* User profiles - Displays badges for actions completed

## Notes on Angular Templates
As NationBuilder doesn't easily support serving of Angular templates, Angular templates are embedded as scripts within the pages that require them.
To strike a balance between minimising file size and avoiding duplication, templates are embedded within the lowest level theme file that will serve all pages that need the template.

eg Templates required by all pages would be placed at the bottom of `layout.html`, while templates required only by the actions page are placed at the bottom of `actions.html`

More information on how Angular is integrated into the application is available [here](http://broadthought.co/2016/03/20/using-angularjs-with-nationbuilder/).

## Key files

The following key Javascript files define the angular content, all are within the `app/theme` directory.

* `app.js` - Define modules and initialisation
* `actions_factories.js` - Service to provide the action configuration (used by actions and badges)
* `actions_controllers.js` - Controllers and directives for action pages
* `badge_controllers.js` - Controllers and directives for displaying badges on user profiles
* `facilitator_controllers.js` - Dynamic content for the /facilitator_admin page

## Updating

The theme files are best edited and updated via NationBuilder's [ThemeSync](http://nationbuilder.com/theme_sync) app.
Use the app to sync the theme and site and when prompted for the folder to sync with, choose `app/theme` and `app/site` respectively.

## Other Folders
`app/action_pages` and `app/kt` are not updated via ThemeSync, but serve as a place to hold revisions of the HTML content for the action pages and kitchen table conversations as there is no other place to easily track revisions in these documents which include non-trivial HTML.

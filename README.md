# Climate for Change Website
This project holds code for dynamic sections of the Climate for Change website that make use of AngularJS.

At the moment this is the following pages:

* /actions - The actions index page
* /act_* - Action instructions
* User profiles - Displays badges for actions completed

## Notes on Angular Templates
As BationBuilder doesn't easily support serving of Angular templates, Angular templates are embedded as scripts within the pages that require them.
To strike a balance between minimising file size and avoiding duplication, templates are embedded within the lowest level theme file that will serve all pages that need the template.

eg Templates required by all pages would be placed at the bottom of `layout.html`, while templates required only by the actions page are placed at the bottom of `actions.html`

## Updating

The theme files are best edited and updated via NationBuilders [ThemeSync](http://nationbuilder.com/theme_sync) app.
Use the app to sync the theme and site and when prompted for the folder to sync with, choose `app/theme` and `app/site` respectively.

## Other Folders
`app/action_pages` and `app_kt` are not updated via ThemeSync, but serve as a staging point for the HTML content for the action pages and kitchen table conversations as there is no other place to easily track revisions in these documents which include non-simple HTML.
//= requireSelf
//= requireTree models
//= requireTree jst
//= requireTree views

(function () {
  'use strict';

  var $ = window.jQuery;
  var _ = window._;

  // Define our global namespace.
  var app = window.OrgSyncWidgets = {
    api: new window.OrgSyncApi({cors: false, key: localStorage.apiKey}),

    // Views will add themselves to this map with their corresponding selectors.
    // i.e. {'.js-osw-browse-portals': app.BrowsePortalsView}
    selectorViewMap: {},

    // In the ready function, run through the selectorViewMap and initialize
    // views accordingly.
    ready: function () {
      if (!app.api.key) return app.authorize();
      _.each(app.selectorViewMap, function (view, selector) {
        $(selector).each(function () { new view({el: this}); });
      });
    },

    authorize: function () {
      var username = window.prompt('Enter your mobile-staging email');
      var password = window.prompt('Enter your mobile-staging password');
      app.api.login(username, password, function (er) {
        if (er) {
          window.alert('Unable to sign in, please try again.');
        } else {
          localStorage.apiKey = app.api.key;
        }
        app.ready();
      });
    }
  };

  // Run the app's ready function when the DOM is parsed.
  $(app.ready);
})();

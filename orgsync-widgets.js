//= require ./setup
//= require jquery/jquery
//= require underscore/underscore
//= require underscore.string/lib/underscore.string
//= require underscore-inherit/underscore-inherit
//= require backbone/backbone
//= require backbone-relations/backbone-relations
//= require select2/select2.js
//= require moment/moment.js
//= require olay/olay.js
//= require async/lib/async
//= require orgsync-javascript-api/orgsync-javascript-api
//= require dpr/dpr.js
//= require elementQuery/elementQuery
//= requireSelf
//= requireTree models
//= requireTree jst
//= requireTree views
//= require ./teardown

(function () {
  'use strict';

  var $ = window.jQuery;
  var _ = window._;
  var dpr = window.dpr;
  var Olay = window.Olay;

  // Define our global namespace.
  var app = window.OrgSyncWidgets = {
    api: new window.OrgSyncApi({cors: false}),

    // Views will add themselves to this map with their corresponding selectors.
    // i.e. {'.js-osw-index-portals': app.IndexPortalsView}
    selectorViewMap: {},

    // In the ready function, run through the selectorViewMap and initialize
    // views accordingly.
    ready: function () {
      $('html').addClass('dpr-' + dpr());
      _.each(app.selectorViewMap, function (view, selector) {
        $(selector).each(function () { new view({el: this}); });
      });
    }
  };

  window.Olay = _.inherit(window.Olay, {
    constructor: function () {
      Olay.apply(this, arguments);
      this.$content.addClass('orgsync-widget');
    }
  });

  // Tell elementQuery to keep track of sizes for `.orgsync-widget`s
  window.elementQuery({
    '.orgsync-widget': {
      'min-width': [
        '231px',
        '251px',
        '461px',
        '480px',
        '501px',
        '640px',
        '691px',
        '751px',
        '800px',
        '921px',
        '960px',
        '1001px'
      ]
    }
  });

  // Run the app's ready function when the DOM is parsed.
  $(app.ready);
})();

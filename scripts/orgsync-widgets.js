//= require ./setup.js
//= require bower_components/jquery/jquery.js
//= require bower_components/underscore/underscore.js
//= require bower_components/underscore.string/lib/underscore.string.js
//= require bower_components/herit/herit.js
//= require bower_components/backbone/backbone.js
//= require bower_components/backbone-relations/backbone-relations.js
//= require bower_components/select2/select2.js
//= require bower_components/moment/moment.js
//= require bower_components/moment-timezone/moment-timezone.js
//= require ./timezones/setup.js
//= require bower_components/moment-timezone/moment-timezone.json
//= require ./timezones/teardown.js
//= require bower_components/jstz/jstz.js
//= require bower_components/olay/olay.js
//= require bower_components/async/lib/async.js
//= require node_modules/orgsync-javascript-api/orgsync-javascript-api.js
//= require bower_components/dpr/dpr.js
//= require bower_components/elementQuery/elementQuery.js
//= require node_modules/mustache/mustache.js
//= require bower_components/tinycolor/tinycolor.js
//= requireSelf
//= requireTree models
//= requireTree jst
//= requireTree views
//= require ./teardown.js

(function () {
  'use strict';

  var $ = window.jQuery;
  var _ = window._;
  var dpr = window.dpr;
  var herit = window.herit;
  var jstz = window.jstz;
  var moment = window.moment;
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
    },

    // Only calculate the current timezone name once.
    tz: jstz.determine().name()
  };

  // requestAnimationFrame shim.
  _.each(['webkit', 'moz'], function (vendor) {
    if (window.requestAnimationFrame) return;
    window.requestAnimationFrame = window[vendor + 'RequestAnimationFrame'];
    window.cancelAnimationFrame =
      window[vendor + 'CancelAnimationFrame'] ||
      window[vendor + 'CancelRequestAnimationFrame'];
  });
  if (!window.requestAnimationFrame) {
    var lastTime = 0;
    window.requestAnimationFrame = function (cb) {
      var now = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (now - lastTime));
      var id = window.setTimeout(_.partial(cb, now + timeToCall), timeToCall);
      lastTime = now + timeToCall;
      return id;
    };
    window.cancelAnimationFrame = clearTimeout;
  }

  window.Olay = herit(window.Olay, {
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
        '401px',
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

  // Fixing the updateOffset method for some wonky DST issues.
  moment.updateOffset = function (date) {
    if (!date._z) return;
    var delta = date.zone();
    var offset = date._z.offset(date);
    if (!(delta -= offset)) return;
    date.zone(offset);
    if (Math.abs(delta) <= 60) date.subtract('minutes', delta);
  };

  // Run the app's ready function when the DOM is parsed.
  $(app.ready);
})();

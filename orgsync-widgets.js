//= requireSelf
//= requireTree models
//= requireTree jst
//= requireTree views

// NOTE: Remove when orgsync-api-javascript is public and add
//    "orgsync-api-javascript": "x",
// to bower.json
(function () {
  'use strict';

  var $ = window.jQuery;
  var _ = window._;

  var OrgSyncApi = window.OrgSyncApi = function (options) {
    if (!options) options = {};
    this.key = options.key;
    var version = this.version = options.version || 1;
    this.urlRoot = 'http://mobile-staging.orgsync.com/user_api/v' + version;
  };

  _.extend(OrgSyncApi.prototype, {
    get: function (path, data, cb) {
      if (!cb) cb = data;
      if (!_.isObject(data)) data = {};
      if (this.key) data.key = this.key;
      return $.ajax({
        type: 'GET',
        url: this.urlRoot + path,
        dataType: 'jsonp',
        data: data,
        success: function (res) {
          if (res.error) return cb(new Error(res.error));
          cb(null, res);
        },
        error: function (xhr) { cb(new Error(xhr.responseText)); }
      });
    }
  });
})();
// -----------------------------------------------------------------------------

(function () {
  'use strict';

  var $ = window.jQuery;
  var _ = window._;

  // Define our global namespace.
  var app = window.OrgSyncWidgets = {
    api: new window.OrgSyncApi(),

    // Views will add themselves to this map with their corresponding selectors.
    // i.e. {'.js-osw-browse-portals': app.BrowsePortalsView}
    selectorViewMap: {},

    // In the ready function, run through the selectorViewMap and initialize
    // views accordingly.
    ready: function () {
      _.each(app.selectorViewMap, function (view, selector) {
        $(selector).each(function () { new view({el: this}); });
      });
    }
  };

  // Run the app's ready function when the DOM is parsed.
  $(app.ready);
})();

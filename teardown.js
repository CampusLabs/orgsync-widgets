// Close and execute the IIFE that was started in setup.js. Here we return all
// of the overriden globals to their previous states.

  var app = window.OrgSyncWidgets;

  // This local delcaration is important to store for the Underscore templates
  // since they use `_.escape`.
  var _ = window._;

  _.each(polutants, function (val, key) {
    app[key] = window[key];
    if (val) return window[key] = val;
    delete window[key];
  });
})();

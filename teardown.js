// Close and execute the IIFE that was started in setup.js. Here we return all
// of the overriden globals to their previous states.

  var app = window.OrgSyncWidgets;

  _.each(polutants, function (val, key) {
    app[key] = window[key];
    if (val) return window[key] = val;

    // `delete window[anything]` throws in IE8, so hack it.
    try { delete window[key]; } catch (er) { window[key] = undefined; }
  });
})();

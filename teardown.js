// Close and execute the IIFE that was started in setup.js. Here we return all
// of the overriden globals to their previous states.

  // This local delcaration is important to store for the Underscore templates
  // since they use `_.escape`.
  var _ = window._;

  // List out all polutants that need to be deleted or restored.
  var polutants = [
    '$',
    'jQuery',
    '_',
    'Backbone',
    'Select2',
    'Olay',
    'async',
    'OrgSyncApi',
    'dpr',
    'jst'
  ];

  _.each(polutants, function (polutant) {
    if (polutant in globals) return window[polutant] = globals[polutant];
    delete window[polutant];
  });
})();

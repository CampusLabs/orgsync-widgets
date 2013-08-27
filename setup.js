// This IIFE is closed and executed in teardown.js. This file must be included
// first and teardown.js last. Here we create a map of every polutant to remove
// and restore after the script has executed.
(function () {
  var polutants = {
    '$': null,
    'jQuery': null,
    '_': null,
    'Backbone': null,
    'Select2': null,
    'Olay': null,
    'async': null,
    'OrgSyncApi': null,
    'dpr': null,
    'jst': null
  };

  for (var key in polutants) {
    polutants[key] = window[key];
    delete window[key];
  }

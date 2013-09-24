// This IIFE is closed and executed in teardown.js. This file must be included
// first and teardown.js last. Here we create a map of every polutant to remove
// and restore after the script has executed.
(function () {
  var polutants = {
    '$': null,
    '_': null,
    'async': null,
    'Backbone': null,
    'dpr': null,
    'elementQuery': null,
    'moment': null,
    'Olay': null,
    'OrgSyncApi': null,
    'Select2': null,
    'jQuery': null,
    'jst': null
  };

  for (var key in polutants) {
    polutants[key] = window[key];
    delete window[key];
  }

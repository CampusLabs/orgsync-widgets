// This IIFE is closed and executed in teardown.js. This file must be included
// first and teardown.js last. Here we create a map of every polutant to remove
// and restore after the script has executed.
(function () {
  var polutants = {
    $: null,
    _: null,
    async: null,
    Backbone: null,
    dpr: null,
    elementQuery: null,
    herit: null,
    moment: null,
    Mustache: null,
    Olay: null,
    OrgSyncApi: null,
    Select2: null,
    tinycolor: null,
    jQuery: null,
    JST: null,
    jstz: null
  };

  for (var key in polutants) {
    polutants[key] = window[key];

    // `delete window[anything]` throws in IE8, so hack it.
    try { delete window[key]; } catch (er) { window[key] = undefined; }
  }

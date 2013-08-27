// This IIFE is closed and executed in teardown.js. This file must be included
// first and teardown.js last. Here we create a map of every global (every key
// on `window`) to restore after the script has executed.
(function () {
  var globals = {};

  for (var key in window) globals[key] = window[key];

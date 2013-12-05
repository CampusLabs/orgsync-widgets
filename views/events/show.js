//= require ../view.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var View = app.View;
  var JST = window.JST;

  app.EventsShowView = View.extend({
    className: 'js-osw-events-show osw-events-show',

    template: JST['jst/events/show'],

    options: ['eventDate']
  });
})();

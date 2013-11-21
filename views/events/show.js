//= require ../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var View = app.View;
  var jst = window.jst;

  app.EventsShowView = View.extend({
    className: 'js-osw-events-show osw-events-show',

    template: jst['events/show'],

    options: ['eventDate']
  });
})();

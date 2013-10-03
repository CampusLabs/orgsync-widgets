//= require ../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var jst = window.jst;
  var moment = window.moment;
  var View = app.View;

  app.EventDatesShowView = View.extend({
    template: jst['event-dates/show'],

    classes: [
      'orgsync-widget',
      'js-osw-event-dates-show',
      'osw-event-dates-show'
    ],

    start: function () {
      return moment(this.model.get('starts_at')).format('h:mm a');
    },

    end: function () {
      return moment(this.model.get('ends_at')).format('h:mm a');
    }
  });
})();

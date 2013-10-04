//= require ../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var jst = window.jst;
  var View = app.View;

  app.EventDatesShowView = View.extend({
    template: jst['event-dates/show'],

    classes: [
      'orgsync-widget',
      'js-osw-event-dates-show',
      'osw-event-dates-show'
    ],

    time: function () {
      var start = this.model.start();
      var end = this.model.end();
      var allDay = this.model.isAllDay();
      var multiDay = this.model.isMultiDay();
      if (!multiDay && allDay) return 'All Day';
      var format = allDay ? '[All Day]' : 'LT';
      if (multiDay) format += ', MMM D';
      return start.format(format) + ' to ' + end.format(format);
    }
  });
})();

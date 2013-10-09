//= require ../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var Olay = window.Olay;
  var jst = window.jst;
  var View = app.View;

  app.EventDatesShowView = View.extend({
    template: jst['event-dates/show'],

    events: {
      click: 'open'
    },

    options: ['day'],

    classes: [
      'orgsync-widget',
      'js-osw-event-dates-show',
      'osw-event-dates-show'
    ],

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      this.event = this.model.get('event');
      if (this.event.get('is_all_day')) this.$el.addClass('js-all-day');
      if (this.day) {
        var day = this.day.date();
        if (this.firstDow = !day.weekday()) this.$el.addClass('js-first-dow');
        if (this.continued = day.isAfter(this.model.start().startOf('day'))) {
          this.$el.addClass('js-continued');
        }
        if (this.continues = day.add('day', 1).isBefore(this.model.end())) {
          this.$el.addClass('js-continues');
        }
      }
    },

    shortTime: function () {
      if (this.event.get('is_all_day')) return 'All Day';
      var date = this.model.start();
      var format = 'h A';
      if (this.continued) {
        if (this.continues) return 'All Day';
        date = this.model.end();
        format = '[ends at ]' + format;
      }
      return date.format(format);
    },

    longTime: function () {
      var start = this.model.start();
      var end = this.model.end();
      var allDay = this.event.get('is_all_day');
      var multiDay = this.model.isMultiDay();
      if (!multiDay && allDay) return 'All Day';
      var format = allDay ? '[All Day]' : 'LT';
      if (multiDay) format += ', MMM D';
      return start.format(format) + ' to ' + end.format(format);
    },

    open: function () {
      if (this.olay) return this.olay.show();
      (this.views.event = new app.EventsShowView({model: this.event})).render();
      (this.olay = new Olay(this.views.event.el)).show();
    }
  });
})();

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

    listeners: {
      event: {'change:visible': 'correctDisplay'}
    },

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      this.event = this.model.get('event');
      this.correctDisplay();
      if (this.event.get('is_all_day')) this.$el.addClass('js-all-day');
      if (this.day) {
        var day = this.day.date();
        var startDay = this.model.start().clone().startOf('day');
        var end = this.model.end();
        if (this.firstDow = !day.weekday()) this.$el.addClass('js-first-dow');
        if (this.continued = +day > +startDay) {
          this.$el.addClass('js-continued');
        }
        if (this.continues = +day.clone().add('day', 1) < +end) {
          this.$el.addClass('js-continues');
        }
      }
    },

    shortTime: function () {
      if (this.event.get('is_all_day')) return 'All Day';
      if (!this.continued) return this.model.start().format('h A');
      if (this.continues) return 'All Day';
      return this.model.end().format('[ends ]h A');
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
    },

    correctDisplay: function () {
      this.$el.toggleClass('js-none', !this.event.get('visible'));
    }
  });
})();

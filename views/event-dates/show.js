//= require ../view.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var Olay = window.Olay;
  var JST = window.JST;
  var View = app.View;

  app.EventDatesShowView = View.extend({
    template: JST['jst/event-dates/show'],

    events: {
      click: 'open'
    },

    view: 'month',

    options: ['day', 'view'],

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
      if (this.model.get('filler')) this.$el.addClass('js-filler');
      if (this.day) {
        var day = this.day.date();
        var startDay = this.model.start().clone().startOf('day');
        var end = this.model.end();
        if (this.firstDow = !day.weekday()) this.$el.addClass('js-first-dow');
        if (this.continued = day.isAfter(startDay)) {
          this.$el.addClass('js-continued');
        }
        if (this.continues = day.clone().add('day', 1).isBefore(end)) {
          this.$el.addClass('js-continues');
        }
      }
    },

    open: function () {
      if (this.olay) return this.olay.show();
      (this.views.event = new app.EventsShowView({
        model: this.event,
        eventDate: this.model
      })).render();
      (this.olay = new Olay(this.views.event.el)).show();
    },

    correctDisplay: function () {
      this.$el.toggleClass('js-none', !this.event.get('visible'));
    }
  });
})();

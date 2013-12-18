//= require ../view.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var _ = window._;
  var EventFilter = app.EventFilter;
  var Olay = window.Olay;
  var JST = window.JST;
  var View = app.View;

  app.EventDatesShowView = View.extend({
    template: JST['jst/event-dates/show'],

    events: {
      click: 'open'
    },

    view: 'month',

    options: ['day', 'view', 'eventFilters'],

    classes: [
      'orgsync-widget',
      'js-osw-event-dates-show',
      'osw-event-dates-show'
    ],

    listeners: {
      model: {'change:visible': 'correctDisplay'}
    },

    toTemplate: function () {
      var eventDate = this.model;
      var event = eventDate.get('event');
      return {
        image: event.get('thumbnail_url'),
        shortTime: this.shortTime(),
        title: !eventDate.get('filler') && event.get('title'),
        longTime: this.longTime(),
        location: event.get('location')
      };
    },

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      this.event = this.model.get('event');
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
      this.correctDisplay();
    },

    shortTime: function () {
      if (this.model.get('event').get('is_all_day')) return 'all day';
      if (!this.continued) return this.shortTimeFormat(this.model.start());
      if (this.continues) return 'all day';
      return 'ends ' + this.shortTimeFormat(this.model.end());
    },

    shortTimeFormat: function (date) {
      return date.format('h:mma').replace(':00', '').replace('m', '');
    },

    longTime: function () {
      var start = this.model.start();
      var end = this.model.end();
      var allDay = this.model.get('event').get('is_all_day');
      var multiDay = this.model.isMultiDay();
      if (!multiDay && allDay) return 'All Day';
      var format = allDay ? '[All Day]' : 'LT';
      if (multiDay) format += ', MMM D';
      return start.format(format) + ' to ' + end.format(format);
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
      this.$el.toggleClass('js-none', !this.model.get('visible'));
    },

    color: function () {
      var eventFilters = this.eventFilters;
      var eventFilterId = _.find(this.model.get('filters'), function (id) {
        var eventFilter = eventFilters.get(id);
        return eventFilter && eventFilter.get('enabled');
      });
      return (eventFilters.get(eventFilterId) || new EventFilter()).color();
    },
  });
})();

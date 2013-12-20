//= require ../view.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var JST = window.JST;
  var View = app.View;

  app.EventDatesShowView = View.extend({
    template: JST['jst/event-dates/show'],

    options: ['day'],

    classes: [
      'orgsync-widget',
      'js-osw-event-dates-show',
      'osw-event-dates-show'
    ],

    toTemplate: function () {
      var eventDate = this.model;
      var event = eventDate.get('event');
      return {
        description: event.get('description'),
        image: event.get('thumbnail_url'),
        isGoing: eventDate.isGoing(),
        isMultiDay: eventDate.isMultiDay(),
        location: event.get('location'),
        longTime: this.longTime(),
        multiDayStart: eventDate.start().format('dddd, MMMM D, YYYY [at] LT'),
        multiDayEnd: eventDate.end().format('dddd, MMMM D, YYYY [at] LT'),
        singleDayDate: eventDate.start().format('dddd, MMMM D, YYYY'),
        portalName: event.get('portal').get('name'),
        shortTime: this.shortTime(),
        title: event.get('title'),
        url: eventDate.orgsyncUrl()
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
      if (this.model.isGoing()) this.$el.addClass('js-is-going');
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
    }
  });
})();

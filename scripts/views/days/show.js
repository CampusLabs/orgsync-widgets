//= require ../view.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var _ = window._;
  var EventDate = app.EventDate;
  var moment = window.moment;
  var JST = window.JST;
  var View = app.View;

  app.DaysShowView = View.extend({
    template: JST['jst/days/show'],

    classes: [
      'orgsync-widget',
      'js-osw-days-show',
      'osw-days-show'
    ],

    view: 'month',

    options: ['view', 'eventFilters'],

    toTemplate: function () {
      return {
        longDate: this.longDate(),
        shortDate: this.shortDate(),
        dataDate: this.model.date().format('YYYY-MM-DD')
      };
    },

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      var date = this.model.date().clone();
      this.$el.addClass(
        'js-day-' + this.model.id + ' js-month-' + date.format('YYYY-MM')
      );
      this.eventDates = this.model.get('eventDates');
      this.eventDates.remove(this.eventDates.where({filler: true}));
      var today = moment().tz(date.tz()).startOf('day');
      if (date.isSame(today)) this.$el.addClass('js-today');
      if (date.startOf('week').isSame(today.startOf('week'))) {
        this.$el.addClass('js-current-week');
      }
    },

    render: function () {
      View.prototype.render.apply(this, arguments);
      this.renderEventDatesList();
      return this;
    },

    renderEventDatesList: function () {
      this.eventDates.sort();
      this.views.eventDatesList = new app.ListView({
        el: this.$('.js-event-dates-list'),
        collection: this.eventDates,
        modelView: app.EventDatesListItemView,
        modelViewOptions: {
          day: this.model,
          eventFilters: this.eventFilters
        }
      });
      this.correctDisplay();
    },

    longDate: function () {
      var date = this.model.date();
      var today = moment().tz(date.tz()).startOf('day');
      var prefix = (function () {
        switch (+date) {
        case +today.subtract('day', 1):
          return 'Yesterday, ';
        case +today.add('day', 1):
          return 'Today, ';
        case +today.add('day', 1):
          return 'Tomorrow, ';
        }
        return '';
      })();
      return date.format('[' + prefix + ']dddd, MMMM D, YYYY');
    },

    shortDate: function () {
      var date = this.model.date();
      return (date.date() === 1 ? date.format('MMMM') + ' ' : '') + date.date();
    },

    correctDisplay: function () {
      _.invoke(this.views.eventDatesList.views, 'correctDisplay');
      if (this.view === 'list') return;
      var day = this.model;
      var date = day.date();
      if (!date.weekday()) return;
      var eventDates = day.get('eventDates');
      eventDates.sort({silent: true});
      var hidden = [];
      var starters = [];
      var sorted = [];
      var prev =
        this.collection.at(this.collection.indexOf(day) - 1).get('eventDates');
      eventDates.each(function (eventDate) {
        if (eventDate.get('filler')) return;
        if (!eventDate.get('visible')) {
          hidden.push(eventDate);
        } else if (eventDate.start().clone().startOf('day').isSame(date)) {
          starters.push(eventDate);
        } else {
          sorted[prev.indexOf(eventDate)] = eventDate;
        }
      });
      var l = Math.max(sorted.length, eventDates.length - hidden.length);
      for (var i = 0; i < l; ++i) {
        if (!sorted[i]) {
          sorted[i] = starters.shift() || new EventDate({filler: true});
        }
      }
      eventDates.set(sorted.concat(hidden), {sort: false});
    }
  });
})();

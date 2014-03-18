import _ from 'underscore';
import BaseView from 'views/base';
import ListView from 'views/list';
import DaysShowTemplate from 'jst/days/show';
import EventDatesListItemView from 'views/event-dates/list-item';
module EventDate from 'entities/event-date';
import moment from 'moment-timezone';

export default BaseView.extend({
  template: DaysShowTemplate,

  classes: [
    'orgsync-widget',
    'js-osw-days-show',
    'osw-days-show'
  ],

  view: 'month',

  options: ['view', 'eventFilters'],

  maxEvents: 4,

  toTemplate: function () {
    return {
      longDate: this.longDate(),
      shortDate: this.shortDate(),
      dataDate: this.model.date().format('YYYY-MM-DD')
    };
  },

  initialize: function () {
    BaseView.prototype.initialize.apply(this, arguments);
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
    BaseView.prototype.render.apply(this, arguments);
    this.renderEventDatesList();
    return this;
  },

  renderEventDatesList: function () {
    this.eventDates.sort();
    this.views.eventDatesList = new ListView({
      el: this.$('.js-event-dates-list'),
      collection: this.eventDates,
      modelView: EventDatesListItemView,
      modelViewOptions: {
        day: this.model,
        eventFilters: this.eventFilters,
        view: this.view
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
    this.$('.js-show-more').addClass('js-none');
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
    var limit = l > this.maxEvents ? this.maxEvents - 1 : l;
    var rest = l - limit;
    for (var i = 0; i < l; ++i) {
      if (!sorted[i]) {
        sorted[i] = starters.shift() || new EventDate.Model({filler: true});
      }
      sorted[i].set('visible', i < limit);
    }
    if (rest) {
      this
        .$('.js-show-more')
        .removeClass('js-none')
        .find('.js-show-more-number')
        .text(rest);
    }
    eventDates.set(sorted.concat(hidden), {sort: false});
  }
});

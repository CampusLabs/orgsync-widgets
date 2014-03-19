import BaseView from 'views/base';
import EventDatesShowTemplate from 'jst/event-dates/show';

export default BaseView.extend({
  template: EventDatesShowTemplate,

  options: ['day'],

  classes: [
    'orgsync-widget',
    'js-osw-event-dates-show',
    'osw-event-dates-show'
  ],

  toTemplate: function () {
    return {
      description: this.event.get('description'),
      image: this.event.get('thumbnail_url'),
      isGoing: this.model.isGoing(),
      isMultiDay: this.model.isMultiDay(),
      location: this.event.get('location'),
      longTime: this.longTime(),
      multiDayStart: this.multiDayDateTime('start'),
      multiDayEnd: this.multiDayDateTime('end'),
      singleDayDate: this.model.start().format('dddd, MMMM D, YYYY'),
      portalName: this.event.get('portal').get('name'),
      shortTime: this.shortTime(),
      title: this.event.get('title'),
      url: this.model.webUrl()
    };
  },

  initialize: function () {
    BaseView.prototype.initialize.apply(this, arguments);
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
    if (this.model.isInvited()) this.$el.addClass('js-is-invited');
    if (this.model.isMaybeAttending()) {
      this.$el.addClass('js-is-maybe-attending');
    }
    if (this.model.isGoing()) this.$el.addClass('js-is-going');
  },

  shortTime: function () {
    if (this.event.get('is_all_day')) return 'all day';
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
    var allDay = this.event.get('is_all_day');
    var multiDay = this.model.isMultiDay();
    if (!multiDay && allDay) return 'All Day';
    var format = allDay ? '[All Day]' : 'LT';
    if (multiDay) {
      format += ', MMM D';
      if (allDay) end = end.clone().subtract('day', 1);
    }
    return start.format(format) + ' - ' + end.format(format);
  },

  multiDayDateTime: function (which) {
    var date = this.model[which]();
    var format = 'dddd, MMMM D, YYYY';
    if (this.event.get('is_all_day')) {
      format += ', [All Day]';
      if (which === 'end') date = date.clone().subtract('day', 1);
    } else {
      format += ' [at] LT';
    }
    return date.format(format);
  }
});

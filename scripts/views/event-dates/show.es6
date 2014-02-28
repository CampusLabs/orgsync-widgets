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
      multiDayStart: this.model.start().format('dddd, MMMM D, YYYY [at] LT'),
      multiDayEnd: this.model.end().format('dddd, MMMM D, YYYY [at] LT'),
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

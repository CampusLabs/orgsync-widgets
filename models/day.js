//= require model

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var Model = app.Model;
  var moment = window.moment;

  var Day = app.Day = Model.extend({
    relations: {
      eventDates: {hasMany: 'EventDate', fk: 'day_id'}
    },

    defaults: {
      tz: app.tz
    },

    date: function () { return moment.tz(this.id, this.get('tz')); }
  }, {
    id: function (date) { return date.format('YYYY-MM-DD'); }
  });

  Day.Collection = Model.Collection.extend({
    model: Day,

    comparator: 'id',

    addEvents: function (events) {
      events.each(this.addEvent, this);
      this.fill();
    },

    addEvent: function (event) {
      this.addEventDates(event.get('dates'), this);
    },

    addEventDates: function (eventDates) {
      eventDates.each(this.addEventDate, this);
    },

    addEventDate: function (eventDate) {
      var tz = this.tz;
      if (tz != null) eventDate.set('tz', tz);
      var start = eventDate.start().startOf('day');
      var end = eventDate.end();
      do {
        var id = Day.id(start);
        var day = this.get(id);
        if (!day) this.add(day = new Day({id: id}));
        if (tz != null) day.set('tz', tz);
        day.get('eventDates').add(eventDate);
        start.add('days', 1);
      } while (start.isBefore(end));
    },

    fill: function () {

      // Nothing to do with an empty collection.
      if (!this.length) return;

      // First, make sure the first day is weekday 0 and the last day is weekday
      // 6. This allows moment to be locale aware and start the week on Monday
      // if desired.
      var first = this.first().date();
      var day0 = this.first().date().weekday(0).startOf('day');
      var last = this.last().date();
      var day6 = this.first().date().weekday(6).startOf('day');
      var tz = this.tz;
      if (!first.isSame(day0)) this.add({id: Day.id(day0), tz: tz});
      if (!last.isSame(day6)) this.add({id: Day.id(day6), tz: tz});

      // Finally, fill in all gaps between the first and last days.
      var head = this.first().date();
      var tail = this.last().date();
      while (head.add('day', 1) < tail) {
        var id = Day.id(head);
        if (!this.get(id)) this.add({id: id, tz: tz});
      }
    }
  });
})();

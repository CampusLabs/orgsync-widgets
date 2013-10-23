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

    date: function () {
      return this._date || (this._date = moment.tz(this.id, this.get('tz')));
    }
  }, {
    id: function (date) { return date.format('YYYY-MM-DD'); }
  });

  Day.Collection = Model.Collection.extend({
    model: Day,

    comparator: 'id',

    tz: app.tz,

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
      eventDate.set('tz', tz);
      var start = eventDate.start().clone().startOf('day');
      var end = eventDate.end();
      do {
        var id = Day.id(start);
        var day = this.get(id);
        if (!day) this.add((day = new Day({id: id})).set('tz', tz));
        day.get('eventDates').add(eventDate);
      } while (start.add('days', 1) < end);
    },

    fill: function () {

      // Nothing to do with an empty collection.
      if (!this.length) return;

      // First, make sure the first day is weekday 0 and the last day is weekday
      // 6. This allows moment to be locale aware and start the week on Monday
      // if desired.
      var first = this.first();
      var last = this.last();
      var id0 = Day.id(first.date().clone().startOf('week'));
      var id6 = Day.id(last.date().clone().endOf('week').startOf('day'));
      var tz = this.tz;
      if (first.id !== id0) this.add({id: id0, tz: tz});
      if (last.id !== id6) this.add({id: id6, tz: tz});

      // Finally, fill in all gaps between the first and last days.
      first = this.first().date().clone();
      last = this.last().date();
      while (first.add('day', 1).isBefore(last)) {
        var id = Day.id(first);
        if (!this.get(id)) this.add({id: id, tz: tz});
      }
    },

    fillN: function (n) {
      var edge = n < 0 ? this.first() : this.last();
      this.add({id: Day.id(edge.date().clone().add('days', n)), tz: this.tz});
      this.fill();
    }
  });
})();

//= require model

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var _ = window._;
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

    addEvents: function (events) {
      this.toAdd = {};
      events.each(this.addEvent, this);
      var tz = this.tz || app.tz;
      var id = Day.id(moment().tz(tz).startOf('month'));
      if (!this.toAdd[id]) this.toAdd[id] = new Day({id: id, tz: tz});
      this.fill();
      this.add(_.values(this.toAdd));
    },

    addEvent: function (event) {
      this.addEventDates(event.get('dates'), this);
    },

    addEventDates: function (eventDates) {
      eventDates.each(this.addEventDate, this);
    },

    addEventDate: function (eventDate) {
      var tz = this.tz || app.tz;
      eventDate.set('tz', tz);
      var start = eventDate.start().clone().startOf('day');
      var end = eventDate.end();
      do {
        var id = Day.id(start);
        var day = this.toAdd[id];
        if (!day) this.toAdd[id] = day = new Day({id: id}).set('tz', tz);
        day.get('eventDates').add(eventDate);
      } while (start.add('days', 1) < end);
    },

    fill: function () {
      var toAdd = this.toAdd;
      var days = _.sortBy(toAdd, 'id');

      // Nothing to do with an empty collection.
      if (!days.length) return;

      // First, make sure the first day is weekday 0 and the last day is weekday
      // 6. This allows moment to be locale aware and start the week on Monday
      // if desired.
      var first = days[0];
      var last = days[days.length - 1];
      var id0 = Day.id(first.date().clone().startOf('week'));
      var id6 = Day.id(last.date().clone().endOf('week').startOf('day'));
      var tz = this.tz;
      if (first.id !== id0) first = toAdd[id0] = new Day({id: id0, tz: tz});
      if (last.id !== id6) last = toAdd[id6] = new Day({id: id6, tz: tz});

      // Finally, fill in all gaps between the first and last days.
      first = first.date().clone();
      last = last.date();
      while (first.add('day', 1) < last) {
        var id = Day.id(first);
        if (!toAdd[id]) toAdd[id] = new Day({id: id, tz: tz});
      }
    }
  });
})();

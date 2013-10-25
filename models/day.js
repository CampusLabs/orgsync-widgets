//= require model

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var Model = app.Model;
  var moment = window.moment;

  var Day = app.Day = Model.extend({
    relations: {
      eventDates: {hasMany: 'EventDate', fk: 'day_id'},
      events: {hasMany: 'Event', via: 'eventDates#event', fk: 'event_id'}
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

    fill: function (from, to) {
      var tz = this.tz;

      // Add the from and to days.
      from = new Day({id: Day.id(from), tz: tz});
      to = new Day({id: Day.id(to), tz: tz});
      this.add([from, to]);

      // Fill in all gaps between the from and to days.
      from = from.date().clone();
      to = to.date();
      while (from.add('day', 1).isBefore(to)) {
        var id = Day.id(from);
        if (!this.get(id)) this.add({id: id, tz: tz});
      }
    }
  });
})();

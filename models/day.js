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
      zone: moment().zone()
    },

    date: function () { return moment(this.id).zone(this.get('zone')); }
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
      var zone = this.zone;
      if (zone != null) eventDate.set('zone', zone);
      var start = eventDate.start().startOf('day');
      var end = eventDate.end();
      do {
        var id = +start;
        var day = this.get(id);
        if (!day) this.add(day = new Day({id: id}));
        if (zone != null) day.set('zone', zone);
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
      var day0 = first.clone().startOf('week');
      var last = this.last().date();
      var day6 = last.clone().endOf('week').startOf('day');
      var zone = this.zone;
      if (!first.isSame(day0)) this.add({id: +day0, zone: zone});
      if (!last.isSame(day6)) this.add({id: +day6, zone: zone});

      // Finally, fill in all gaps between the first and last days.
      var head = this.first().date();
      var tail = this.last().date();
      while (head.add('day', 1) < tail) {
        if (!this.get(+head)) this.add({id: +head, zone: zone});
      }
    }
  });
})();

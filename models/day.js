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
    },

    addEvent: function (event) {
      this.addEventDates(event.get('dates'), this);
    },

    addEventDates: function (eventDates) {
      eventDates.each(this.addEventDate, this);
    },

    addEventDate: function (eventDate) {
      if (this.zone != null) eventDate.set('zone', this.zone);
      var start = eventDate.start().startOf('day');
      var end = eventDate.end();
      do {
        var id = +start;
        var day = this.get(id);
        if (!day) this.add(day = new Day({id: id}));
        if (this.zone != null) day.set('zone', this.zone);
        day.get('eventDates').add(eventDate);
        start.add('days', 1);
      } while (start.isBefore(end));
    }
  });
})();

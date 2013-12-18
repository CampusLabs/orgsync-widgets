//= require ./model.js

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
      tz: app.tz,
      visible: true,
      fetched: 0
    },

    initialize: function () {
      this.listenTo(this.get('eventDates'), {
        add: function (eventDate) {
          this.setVisible();
          this.listenTo(
            eventDate.get('event'),
            'change:visible',
            this.setVisible
          );
        },
        remove: function (eventDate) {
          this.setVisible();
          this.stopListening(
            eventDate.get('event'),
            'change:visible',
            this.setVisible
          );
        }
      });
    },

    date: function () {
      return this._date || (this._date = moment.tz(this.id, this.get('tz')));
    },

    setVisible: function () {
      this.set('visible', this.get('eventDates').any(function (eventDate) {
        return !eventDate.get('filler') && eventDate.get('visible');
      }));
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
      } while (start.add('days', 1).isBefore(end));
    },

    fill: function (from, to, fetched) {

      // Hold days to be added in an array before actually adding them. This
      // saves the extra computation that is needed in Backbone's
      // Collection#set.
      var days = [];
      var tz = this.tz;

      // Fill in all gaps between the from and to days.
      from = from.clone();
      do {
        var id = Day.id(from);
        var day = this.get(id);
        if (day) {
          if (fetched && from.isBefore(to)) day.set('fetched', Infinity);
          continue;
        }
        days.push({id: id, tz: tz, fetched: fetched ? Infinity : 0});
      } while (!from.add('day', 1).isAfter(to));

      // Finally, add the new days.
      this.add(days);
    }
  });
})();

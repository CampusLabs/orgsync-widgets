import moment from 'moment-timezone';
import tz from 'tz';

module Base from 'entities/base';
module EventOccurrence from 'entities/event-occurrence';
module Event from 'entities/event';

var Model = Base.Model.extend({
  relations: {
    eventOccurrences: {hasMany: EventOccurrence, fk: 'day_id'},
    events: {hasMany: Event, via: 'eventOccurrences#event', fk: 'event_id'}
  },

  defaults: {
    tz: tz,
    visible: false,
    fetched: 0
  },

  date: function () {
    return this._date || (this._date = moment.tz(this.id, this.get('tz')));
  }
}, {
  id: function (date) { return date.format('YYYY-MM-DD'); }
});

var Collection = Base.Collection.extend({
  model: Model,

  comparator: 'id',

  tz: tz,

  addEvents: function (events) {
    events.each(this.addEvent, this);
  },

  addEvent: function (event) {
    this.addEventOccurrences(event.get('dates'), this);
  },

  addEventOccurrences: function (eventOccurrence) {
    eventOccurrence.each(this.addEventDate, this);
  },

  addEventOccurrence: function (eventOccurrence) {
    var tz = this.tz;
    eventOccurrence.set('tz', tz);
    var start = eventOccurrence.start().clone().startOf('day');
    var end = eventOccurrence.end();
    do {
      var id = Day.Model.id(start);
      var day = this.get(id);
      if (!day) this.add((day = new Day.Model({id: id})).set('tz', tz));
      day.get('eventOccurrences').add(eventOccurrence);
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
      var id = Day.Model.id(from);
      var day = this.get(id);
      if (day) {
        if (fetched && from.isBefore(to)) day.set('fetched', Infinity);
        continue;
      }
      days.push({id: id, tz: tz, fetched: fetched ? Infinity : 0});
    } while (!from.add('day', 1).isAfter(to));

    // Finally, add the new days.
    this.add(days);
  },

  fromDate: function (date) {
    return this.get(Model.id(date));
  }
});

export {Model, Collection};

//= require model

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var Model = app.Model;
  var moment = window.moment;

  var EventDate = app.EventDate = Model.extend({
    relations: {
      event: {hasOne: 'Event', fk: 'event_id'}
    },

    defaults: {
      zone: moment().zone()
    },

    start: function () { return this.zoned('starts_at'); },

    end: function () { return this.zoned('ends_at'); },

    zoned: function (which) {
      var date = moment(this.get(which));
      var zone = this.get('zone');
      if (!this.get('event').get('is_all_day')) return date.zone(zone);

      // HACK: Until event occurrences is out, this is necessary for any
      // duration calculation to work as all day events return the same
      // starts_at and ends_at. This can be removed in the future (hopefully).
      if (which === 'ends_at') date.add('days', 1);

      // All day events should always be midnight to midnight in the timezone
      // they are being viewed in, regardless of the time zone they were created
      // in.
      return moment()
        .zone(zone)
        .year(date.year())
        .month(date.month())
        .date(date.date())
        .startOf('day');
    },

    isMultiDay: function () {
      return this.start().startOf('day').add('days', 1).isBefore(this.end());
    }
  });

  EventDate.Collection = Model.Collection.extend({
    model: EventDate,

    comparator: function (eventDate) { return eventDate.start(); }
  });
})();

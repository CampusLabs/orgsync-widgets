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
      tz: app.tz
    },

    start: function () { return this.normalize('starts_at'); },

    end: function () { return this.normalize('ends_at'); },

    normalize: function (which) {
      var key = '_' + which;
      if (this[key]) return this[key];
      var date = moment(this.get(which));
      var tz = this.get('tz');
      if (!this.get('event').get('is_all_day')) return date.tz(tz);

      // HACK: Until event occurrences is out, this is necessary for any
      // duration calculation to work as all day events return the same
      // starts_at and ends_at. This can be removed in the future (hopefully).
      if (which === 'ends_at') date.add('days', 1);

      // All day events should always be midnight to midnight in the timezone
      // they are being viewed in, regardless of the time zone they were created
      // in.
      return this[key] = moment.tz(app.Day.id(date), tz);
    },

    isMultiDay: function () {
      return this.start().startOf('day').add('days', 1).isBefore(this.end());
    }
  });

  EventDate.Collection = Model.Collection.extend({
    model: EventDate,

    comparator: 'starts_at'
  });
})();

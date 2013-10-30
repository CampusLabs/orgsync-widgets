//= require model

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var _ = window._;
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
      var startDay = this.start().clone().startOf('day');
      return startDay.add('days', 1).isBefore(this.end());
    },

    hex: function (scale) {
      var n = parseInt(this.get('event').get('color'), '16');
      if (isNaN(n)) {
        this.get('event').set('color', (n = _.random(0xFFFFFF)).toString(16));
      }
      if (scale) {
        var r = (n >> 16) % 256;
        r += Math.floor((scale > 0 ? (255 - r) : r) * scale);
        var g = (n >> 8) % 256;
        g += Math.floor((scale > 0 ? (255 - g) : g) * scale);
        var b = n % 256;
        b += Math.floor((scale > 0 ? (255 - b) : b) * scale);
        n = ((r << 16) + (g << 8) + b);
      }
      n = n.toString(16);
      while (n.length < 6) n = '0' + n;
      return '#' + n;
    }
  });

  EventDate.Collection = Model.Collection.extend({
    model: EventDate,

    comparator: function (eventDate) { return eventDate.start(); },

    visible: function () {
      return this.filter(function (eventDate) {
        return eventDate.get('event').get('visible');
      });
    }
  });
})();

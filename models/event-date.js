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

    startMidnight: function (zone) {
      return EventDate.midnight(this.get('starts_at'), zone);
    }
  }, {
    midnight: function (date, zone) {
      date = moment(date);
      if (zone != null) date.zone(zone);
      return date.hours(0).minutes(0).seconds(0).milliseconds(0);
    }
  });

  EventDate.Collection = Model.Collection.extend({
    model: EventDate,

    comparator: 'starts_at'
  });
})();

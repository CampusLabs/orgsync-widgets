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

    start: function () {
      return moment(this.get('starts_at')).zone(this.get('zone'));
    },

    end: function () {
      return moment(this.get('ends_at')).zone(this.get('zone'));
    },

    isMultiDay: function () {
      return this.start().midnight().add('days', 1).isBefore(this.end());
    },

    isAllDay: function () {
      return this.start().isMidnight && this.end().isMidnight();
    }
  });

  EventDate.Collection = Model.Collection.extend({
    model: EventDate,

    comparator: 'starts_at'
  });
})();

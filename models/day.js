//= require model

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var Model = app.Model;

  var Day = app.Day = Model.extend({
    relations: {
      events: {hasMany: 'Event', fk: 'day_id'}
    }
  });

  Day.Collection = Model.Collection.extend({
    model: Day
  });
})();

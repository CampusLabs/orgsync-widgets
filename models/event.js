//= require model

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var Model = app.Model;

  var Event = app.Event = Model.extend({
    relations: {
      portal: {hasOne: 'Portal', fk: 'portal_id'},
      creator: {hasOne: 'Account', fk: 'creator_id'},
      comments: {hasMany: 'Comment', fk: 'event_id'}
    }
  });

  Event.Collection = Model.Collection.extend({
    model: Event,

    comparator: 'name'
  });
})();

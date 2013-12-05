//= require ./model.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var Model = app.Model;

  var Community = app.Community = Model.extend({
    relations: {
      portals: {hasMany: 'Portal', fk: 'community_id'},
      umbrellas: {hasMany: 'Portal', fk: 'community_id'},
      categories: {hasMany: 'Category', fk: 'community_id'},
      events: {hasMany: 'Event', via: 'portals', fk: 'portal_id'}
    },
    urlRoot: '/communities'
  });

  Community.Collection = Model.Collection.extend({
    model: Community,

    url: '/communities'
  });
})();

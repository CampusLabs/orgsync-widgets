//= require model

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var Model = app.Model;

  var Community = app.Community = Model.extend({
    relations: {
      portals: {hasMany: 'Portal', fk: 'school_id'},
      umbrellas: {hasMany: 'Portal', fk: 'school_id'},
      categories: {hasMany: 'Category', fk: 'school_id'},
    },
    urlRoot: '/communities'
  });

  Community.Collection = Model.Collection.extend({
    model: Community,

    url: '/communities'
  });
})();

//= require ./model.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var Model = app.Model;

  var Category = app.Category = Model.extend({
    relations: {
      portals: {hasMany: 'Portal', fk: 'category_id'}
    }
  });

  Category.Collection = Model.Collection.extend({
    model: Category,

    comparator: 'name'
  });
})();

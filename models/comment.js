//= require model

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var Model = app.Model;

  var Comment = app.Comment = Model.extend({
    relations: {
      'creator': {hasOne: 'Account', fk: 'creator_id'}
    }
  });

  Comment.Collection = Model.Collection.extend({
    model: Comment
  });
})();

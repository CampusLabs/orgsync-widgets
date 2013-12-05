//= require ./model.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var Model = app.Model;
  var moment = window.moment;

  var Comment = app.Comment = Model.extend({
    relations: {
      'creator': {hasOne: 'Account', fk: 'creator_id'}
    },

    time: function () {
      return moment(this.get('created_at')).fromNow();
    },
  });

  Comment.Collection = Model.Collection.extend({
    model: Comment
  });
})();

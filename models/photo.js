//= require ./model.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var Model = app.Model;

  var Photo = app.Photo = Model.extend({
    relations: {
      album: {hasOne: 'Album', fk: 'album_id'},
      comments: {hasMany: 'Comment', fk: 'photo_id'}
    },

    orgsyncUrl: function () {
      return this.get('album').orgsyncUrl() + '/photo/' + this.id;
    }
  });

  Photo.Collection = Model.Collection.extend({
    model: Photo
  });
})();

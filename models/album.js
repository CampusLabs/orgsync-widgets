//= require model

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var Model = app.Model;

  var Album = app.Album = Model.extend({
    relations: {
      portal: {hasOne: 'Portal', fk: 'portal_id'},
      photos: {hasMany: 'Photo', fk: 'album_id'}
    }
  });

  Album.Collection = Model.Collection.extend({
    model: Album
  });
})();

import {Model, Collection} from 'models/base';

var Photo = Model.extend({
  relations: {
    album: {hasOne: 'album', fk: 'album_id'},
    comments: {hasMany: 'comment', fk: 'photo_id'}
  },

  orgsyncUrl: function () {
    return this.get('album').orgsyncUrl() + '/photo/' + this.id;
  }
});

Photo.Collection = Collection.extend({
  model: Photo
});

export default = Photo;

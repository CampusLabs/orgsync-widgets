module Base from 'entities/base';
module Album from 'entities/album';
module Comment from 'entities/comment';

var Model = Base.Model.extend({
  relations: function () {
    return {
      album: {hasOne: Album.Model, fk: 'album_id'},
      comments: {hasMany: Comment.Collection, fk: 'photo_id'}
    };
  },

  orgsyncUrl: function () {
    return this.get('album').orgsyncUrl() + '/photo/' + this.id;
  }
});

var Collection = Base.Collection.extend({
  model: Model
});

export {Model, Collection};

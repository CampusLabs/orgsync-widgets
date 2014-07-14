import Base from 'entities/base';
import Album from 'entities/album';
import Comment from 'entities/comment';

var Model = Base.Model.extend({
  relations: {
    album: {hasOne: Album, fk: 'album_id'},
    comments: {
      hasMany: Comment,
      fk: 'photo_id',
      url: function () { return this.owner.get('links').comments; }
    }
  }
});

var Collection = Base.Collection.extend({
  model: Model
});

export {Model, Collection};

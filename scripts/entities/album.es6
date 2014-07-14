import Base from 'entities/base';
import Portal from 'entities/portal';
import Photo from 'entities/photo';

var Model = Base.Model.extend({
  relations: {
    portal: {hasOne: Portal, fk: 'portal_id'},
    photos: {hasMany: Photo, fk: 'album_id'}
  }
});

var Collection = Base.Collection.extend({
  model: Model
});

export {Model, Collection};

module Base from 'entities/base';
module Portal from 'entities/portal';
module Photo from 'entities/photo';

var Model = Base.Model.extend({
  relations: function () {
    return {
      portal: {hasOne: Portal.Model, fk: 'portal_id'},
      photos: {hasMany: Photo.Collection, fk: 'album_id'}
    };
  }
});

var Collection = Base.Collection.extend({
  model: Model
});

export {Model, Collection};

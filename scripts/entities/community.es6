import Base from 'entities/base';
import Portal from 'entities/portal';
import Category from 'entities/category';
import Event from 'entities/event';

var Model = Base.Model.extend({
  relations: {
    portals: {hasMany: Portal, fk: 'community_id'},
    umbrellas: {hasMany: Portal, fk: 'community_id'},
    categories: {hasMany: Category, fk: 'community_id'}
  },

  urlRoot: '/communities'
});

var Collection = Base.Collection.extend({
  model: Model,

  url: '/communities'
});

export {Model, Collection};

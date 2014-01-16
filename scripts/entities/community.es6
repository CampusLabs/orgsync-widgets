module Base from 'entities/base';
module Portal from 'entities/portal';
module Category from 'entities/category';
module Event from 'entities/event';

var Model = Base.Model.extend({
  relations: {
    portals: {hasMany: Portal, fk: 'community_id'},
    umbrellas: {hasMany: Portal, fk: 'community_id'},
    categories: {hasMany: Category, fk: 'community_id'},
    events: {hasMany: Event, via: 'portals', fk: 'portal_id'}
  },

  urlRoot: '/communities'
});

var Collection = Base.Collection.extend({
  model: Model,

  url: '/communities'
});

export {Model, Collection};

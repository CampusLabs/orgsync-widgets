module Base from 'entities/base';
module Portal from 'entities/portal';
module Category from 'entities/category';
module Event from 'entities/event';

var Model = Base.Model.extend({
  relations: function () {
    return {
      portals: {hasMany: Portal.Collection, fk: 'community_id'},
      umbrellas: {hasMany: Portal.Collection, fk: 'community_id'},
      categories: {hasMany: Category.Collection, fk: 'community_id'},
      events: {hasMany: Event.Collection, via: 'portals', fk: 'portal_id'}
    };
  },
  
  urlRoot: '/communities'
});

var Collection = Base.Collection.extend({
  model: Model,

  url: '/communities'
});

export {Model, Collection};

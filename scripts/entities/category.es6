module Base from 'entities/base';
module Portal from 'entities/portal';

var Model = Base.Model.extend({
  relations: {
    portals: {hasMany: Portal, fk: 'category_id'}
  }
});

var Collection = Base.Collection.extend({
  model: Model,

  comparator: 'name'
});

export {Model, Collection};
module Base from 'entities/base';

var Model = Base.Model.extend();

var Collection = Base.Collection.extend({
  model: Model
});

export {Model, Collection};

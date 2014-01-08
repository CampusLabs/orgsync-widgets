import {Model, Collection} from 'models/base';

var Category = Model.extend({
  relations: {
    portals: {hasMany: 'portal', fk: 'category_id'}
  }
});

Category.Collection = Collection.extend({
  model: Category,

  comparator: 'name'
});

export default = Category;

import Model from 'models/model';

var Category = Model.extend({
  relations: {
    portals: {hasMany: 'portal', fk: 'category_id'}
  }
});

Category.Collection = Model.Collection.extend({
  model: Category,

  comparator: 'name'
});

export default = Category;

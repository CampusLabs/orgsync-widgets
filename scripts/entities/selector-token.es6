module Base from 'entities/base';

var Model = Base.Model.extend();

var Collection = Base.Collection.extend({
  model: Model,

  sync: function (method, model, options) {
    live.send('selector', options.data, function (er, results) {
      if (er) return options.error(er);
      options.success(results);
    });
  }
});

export {Model, Collection};

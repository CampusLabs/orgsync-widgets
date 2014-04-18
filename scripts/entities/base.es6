import _ from 'underscore';
import api from 'api';

module BackboneRelations from 'backbone-relations';

var methodMap = {
  create: 'post',
  read: 'get',
  update: 'put',
  delete: 'delete',
  patch: 'patch'
};

var Model = BackboneRelations.Model.extend({
  constructor: function () {
    this.constructor.resolveRelations();
    BackboneRelations.Model.apply(this, arguments);
  },

  sync: function (method, model, options) {
    var url = _.result(model, 'url');
    var data = options.data;
    model.requestCount == null ? model.requestCount = 1 : model.requestCount++;
    model.trigger('request:start');
    return api[methodMap[method]](url, data, function (er, res) {
      model.requestCount--;
      model.trigger('request:end');
      if (er || (er = res.error)) return options.error(er);
      options.success(res.data);
    });
  }
}, {
  resolveRelations: function () {
    resolveRelations: function () {
    if (this === Model || this.relationsAreResolved) return;
    _.each(this.prototype.relations, function (rel) {
      if (rel.hasOne) rel.hasOne = rel.hasOne.Model;
      if (rel.hasMany) rel.hasMany = rel.hasMany.Collection;
      var fk = rel.fk;
      if (rel.via || !fk) return;
      var Model = rel.hasOne || rel.hasMany.prototype.model;
      var complement = Model.prototype.relations;
      var hasOne = !rel.hasOne;
      rel.reverse = _.reduce(complement, function (reverse, rel, key) {
        if (!rel.via && hasOne !== !rel.hasOne && fk === rel.fk) return key;
        return reverse;
      }, null);
    });
    this.relationsAreResolved = true;
  }
});

var Collection = BackboneRelations.Collection.extend({
  model: Model,

  sync: Model.prototype.sync
});

export {Model, Collection};

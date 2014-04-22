import _ from 'underscore';

module BackboneRelations from 'backbone-relations';

var Model = BackboneRelations.Model.extend({
  constructor: function () {
    this.constructor.resolveRelations();
    BackboneRelations.Model.apply(this, arguments);
  }
}, {
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
  model: Model
});

export {Model, Collection};

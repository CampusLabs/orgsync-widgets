(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var _ = window._;
  var Backbone = window.Backbone;

  var Model = app.Model = Backbone.Model.extend({
    constructor: function () {
      this.constructor.relations();
      Backbone.Model.apply(this, arguments);
    },

    sync: function (method, model, options) {
      var url = _.result(model, 'url');
      var data = options.data;
      return app.api.get(url, data, function (er, res) {
        if (er || res.error) return options.error(er || res.error);
        options.success(res.data);
      });
    }
  }, {
    relations: function () {
      if (this._relations) return this._relations;
      var relations = _.result(this.prototype, 'relations');
      if (!relations) return this._relations = {};
      if (_.isFunction(this.prototype.relations)) {
        return this._relations = this.prototype.relations = relations;
      }
      relations = _.reduce(relations, function (rels, rel, key) {
        var Model = app[rel.hasOne || rel.hasMany];
        if (rel.hasOne) rel.hasOne = Model;
        if (rel.hasMany) rel.hasMany = Model.Collection;
        if (!rel.via) {
          var complement = Model.prototype.relations;
          var hasOne = !rel.hasOne;
          var fk = rel.fk;
          rel.reverse = _.reduce(complement, function (reverse, rel, key) {
            if (!rel.via && hasOne !== !rel.hasOne && fk === rel.fk) return key;
            return reverse;
          }, null);
        }
        rels[key] = rel;
        return rels;
      }, {});
      return this._relations = this.prototype.relations = relations;
    }
  });

  Model.Collection = Backbone.Collection.extend({
    model: Model,

    sync: Model.prototype.sync
  });
})();

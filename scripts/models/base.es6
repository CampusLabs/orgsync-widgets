import _ from 'underscore';
import async from 'async';
import {api} from 'app';
import {Model, Collection} from 'backbone-relations';
import require from 'require';

var BaseModel = Model.extend({
  constructor: function () {
    this.constructor.relations();
    Model.apply(this, arguments);
  },

  sync: function (method, model, options) {
    var url = _.result(model, 'url');
    var data = options.data;
    return api.get(url, data, function (er, res) {
      if (er || res.error) {
        options.error(er || res.error);
        return model.trigger('error');
      }
      options.success(res.data);
      model.trigger('sync');
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
      var Model = require('models/' + (rel.hasOne || rel.hasMany));
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

var BaseCollection = Collection.extend({
  model: BaseModel,

  sync: Model.prototype.sync,

  pagedFetch: function (options) {
    options = options ? _.clone(options) : {};
    var limit = options.limit || Infinity;
    var page = 0;
    var perPage = options.per_page || 100;
    var data = options.data || {};
    var success = options.success || function () {};
    var error = options.error || function () {};
    delete options.success;
    delete options.error;
    var self = this;
    var length = -1;
    async.whilst(
      function () {
        var l = self.length;
        return !(length === l || (length = l) >= limit || length % perPage);
      },
      function (cb) {
        self.fetch({
          data: _.extend({
            page: ++page,
            per_page: perPage
          }, data),
          remove: false,
          success: _.bind(cb, null, null),
          error: error
        });
      },
      function () {
        length = self.length;
        if (limit && length > limit) self.remove(self.last(length - limit));
        if (success) success(self, self.models, options);
      }
    );
  }
});

export var Model = BaseModel;
export var Collection = BaseCollection;

//= require view

(function () {
  'use strict';

  var $ = window.jQuery;
  var _ = window._;
  var app = window.OrgSyncWidgets;

  app.ListView = app.View.extend({
    initialize: function (options) {
      app.View.prototype.initialize.apply(this, arguments);
      this.listenTo(this.collection, {
        add: this.addModel,
        sort: this.sortModels,
        remove: this.removeModel
      });
      _.extend(this, _.pick(options, 'modelView', 'modelViewOptions'));
      this.collection.each(this.addModel, this);
    },

    addModel: function (model) {
      if (this.views[model.cid]) return;
      this.$el.append((this.views[model.cid] = new this.modelView(_.extend({
        collection: this.collection,
        model: model
      }, this.modelViewOptions))).render().el);
    },

    sortModels: function () {
      var views = this.views;
      var $el = this.$el;
      var $models = $el.children();
      this.collection.each(function (model, i) {
        var el = views[model.cid].el;
        if (!$models[i]) {
          $el.append(el);
        } else if ($models[i] !== el) {
          $models.eq(i).before(el);
          $models = $($models.get().splice(i, 0, el));
        }
      });
    },

    removeModel: function (model) {
      delete this.views[model.cid];
    }
  });
})();

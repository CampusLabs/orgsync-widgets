//= require ./view.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var _ = window._;
  var View = app.View;

  app.ListView = View.extend({
    options: [
      'modelView',
      'modelViewOptions',
    ],

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      this.listenTo(this.collection, {
        add: this.addModel,
        sort: this.sortModels,
        remove: this.removeModel
      });
      this.collection.each(this.addModel, this);
      this.sortModels();
    },

    addModel: function (model) {
      if (this.views[model.cid]) return;
      (this.views[model.cid] = new this.modelView(_.extend({
        collection: this.collection,
        model: model
      }, this.modelViewOptions))).render();
    },

    sortModels: function () {
      this.$el.html(this.collection.map(function (model) {
        return this.views[model.cid].$el.detach();
      }, this));
    },

    removeModel: function (model) {
      this.views[model.cid].remove();
      delete this.views[model.cid];
    }
  });
})();

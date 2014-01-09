import _ from 'underscore';
import BaseView from 'views/base';

export default BaseView.extend({
  options: [
    'modelView',
    'modelViewOptions',
  ],

  initialize: function () {
    BaseView.prototype.initialize.apply(this, arguments);
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
    var views = this.views;
    this.$el.html(this.collection.map(function (model) {
      return views[model.cid].$el.detach();
    }));
  },

  removeModel: function (model) {
    this.views[model.cid].remove();
    delete this.views[model.cid];
  }
});

//= require view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = window.jQuery;
  var _ = window._;
  var View = app.View;

  app.ListView = View.extend({
    page: 0,

    pageSize: 10,

    threshold: 500,

    options: [
      'modelView',
      'modelViewOptions',
      'infiniteScroll',
      'threshold',
      'pageSize'
    ],

    listeners: {
      available: {
        add: 'nextPage'
      }
    },

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      if (this.infiniteScroll) {
        _.bindAll(this, 'nextPage');
        this.$scrollParent().on('scroll', this.nextPage);
        $(window).on('resize', this.nextPage);
        this.available = this.collection;
        this.collection = new this.available.constructor();
      }
      this.listenTo(this.collection, {
        add: this.addModel,
        sort: this.sortModels,
        remove: this.removeModel
      });
      this.collection.each(this.addModel, this);
      this.sortModels();
      if (this.infiniteScroll) this.refresh();
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
    },

    $scrollParent: function () {
      if (this._$scrollParent) return this._$scrollParent;
      var parents = [this.el].concat(this.$el.parents().toArray());
      return this._$scrollParent = $(_.find(parents, function (parent) {
        var overflowY = $(parent).css('overflow-y');
        return overflowY === 'auto' || overflowY === 'scroll';
      }) || window);
    },

    nextPage: function (force) {
      var needsPage = force === true || this.needsPage();
      if (needsPage && this.collection.length < this.available.length) {
        if (!this.page) this.$el.empty();
        this.collection.add(
          this.available.models.slice(
            this.page * this.pageSize,
            ++this.page * this.pageSize
          )
        );
        _.defer(this.nextPage);
      } else {
        this.trigger('done-paging');
      }
    },

    needsPage: function (scrollTop) {
      var $scrollParent = this.$scrollParent();
      var isWindow = $scrollParent[0] === window;
      var aH = $scrollParent.height();
      if (scrollTop == null) {
        scrollTop = (isWindow ? $(document) : $scrollParent).scrollTop();
      }
      var bY = this.$el[isWindow ? 'offset' : 'position']().top;
      var bH = this.$el.prop('scrollHeight');
      var threshold = this.threshold;
      return aH + scrollTop > bY + bH - threshold;
    },

    refresh: function () {
      this.page = 0;
      this.collection.set();
      this.nextPage();
    },

    remove: function () {
      if (this.infiniteScroll) {
        this.$scrollParent().off('scroll', this.nextPage);
        $(window).off('resize', this.nextPage);
      }
      return View.prototype.remove.apply(this, arguments);
    }
  });
})();

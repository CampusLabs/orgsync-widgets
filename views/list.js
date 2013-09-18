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

    tolerance: 250,

    initialize: function (options) {
      View.prototype.initialize.apply(this, arguments);
      _.extend(this, _.pick(
        options,
        'modelView',
        'modelViewOptions',
        'infiniteScroll',
        'tolerance',
        'pageSize'
      ));
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
      if (this.infiniteScroll) this.refresh();
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
    },

    $scrollParent: function () {
      if (this._$scrollParent) return this._$scrollParent;
      var parents = [this.el].concat(this.$el.parents().toArray());
      return this._$scrollParent = $(_.find(parents, function (parent) {
        var overflowY = $(parent).css('overflow-y');
        return overflowY === 'auto' || overflowY === 'scroll';
      }) || window);
    },

    nextPage: function () {
      if (this.needsPage() && this.collection.length < this.available.length) {
        if (!this.page) this.$el.empty();
        this.collection.add(
          this.available.models.slice(
            this.page * this.pageSize,
            ++this.page * this.pageSize
          )
        );
        _.defer(this.nextPage);
      }
    },

    needsPage: function () {
      var $scrollParent = this.$scrollParent();
      var isWindow = $scrollParent[0] === window;
      var aH = $scrollParent.height();
      var scroll = (isWindow ? $(document) : $scrollParent).scrollTop();
      var bY = this.$el[isWindow ? 'offset' : 'position']().top;
      var bH = this.$el.prop('scrollHeight');
      var tolerance = this.tolerance;
      return aH + scroll > bY + bH - tolerance;
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

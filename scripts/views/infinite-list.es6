import $ from 'jquery';
import _ from 'underscore';
import BaseView from 'views/base';
import ListView from 'views/list';

export default ListView.extend({
  page: 0,

  pageSize: 10,

  threshold: 500,

  options: [
    'modelView',
    'modelViewOptions',
    'threshold',
    'pageSize'
  ],

  listeners: {
    available: {
      add: 'nextPage'
    }
  },

  initialize: function () {
    BaseView.prototype.initialize.apply(this, arguments);
    _.bindAll(this, 'nextPage');
    this.$scrollParent().on('scroll', this.nextPage);
    $(window).on('resize', this.nextPage);
    this.available = this.collection;
    this.collection = new this.available.constructor();
    this.listenTo(this.collection, {
      add: this.addModel,
      sort: this.sortModels,
      remove: this.removeModel
    });
    this.collection.each(this.addModel, this);
    this.sortModels();
    this.refresh();
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
      this.collection.set(
        this.available.models.slice(0, ++this.page * this.pageSize)
      );
      window.requestAnimationFrame(this.nextPage);
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
    this.$scrollParent().off('scroll', this.nextPage);
    $(window).off('resize', this.nextPage);
    return ListView.prototype.remove.apply(this, arguments);
  }
});

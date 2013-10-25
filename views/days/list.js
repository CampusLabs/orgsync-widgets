//= require ../list
//= require ./show

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = window.jQuery;
  var _ = window._;
  var Day = app.Day;
  var ListView = app.ListView;
  var moment = window.moment;

  app.DaysListView = ListView.extend({
    threshold: 800,

    view: 'month',

    modelView: app.DaysShowView,

    options: [
      'threshold',
      'pageSize',
      'view',
      'initialDate'
    ],

    events: {
      scroll: 'padAndTrim',
      mousedown: 'onMousedown',
      mouseup: 'onMouseup'
    },

    listeners: {},

    initialize: function () {
      this.padAndTrim = _.bind(this.padAndTrim, this);
      $(window).on('resize', this.padAndTrim);
      this.available = this.collection;
      this.collection = new Day.Collection();
      this.collection.tz = this.available.tz;
      ListView.prototype.initialize.apply(this, arguments);
      this.setView(this.view, this.initialDate);
    },

    pageSize: function () {
      return this.view === 'month' ? 7 : 1;
    },

    needsAbove: function () {
      return this.$el.scrollTop() <= this.threshold;
    },

    renderAbove: function () {
      var collection = this.collection;
      var available = this.available;
      var pageSize = this.pageSize();
      var edge = collection.first();
      var target = edge.date().clone().subtract('days', pageSize);
      var targetId = Day.id(target);
      available.fill(target, edge.date());
      var scrollHeight = this.$el.prop('scrollHeight');
      var i = available.indexOf(available.get(targetId));
      collection.add(available.models.slice(i, i + pageSize));
      var delta = this.$el.prop('scrollHeight') - scrollHeight;
      this.lastScrollTop += delta;
      this.$el.scrollTop(this.$el.scrollTop() + delta);
    },

    extraAbove: function () {
      var $el = this.$el;
      var scrollTop = $el.scrollTop();
      var firstHeight = $el.children().first().outerHeight();
      return scrollTop > this.threshold + firstHeight;
    },

    removeAbove: function () {
      var scrollHeight = this.$el.prop('scrollHeight');
      this.collection.remove(this.collection.first(this.pageSize()));
      var delta = this.$el.prop('scrollHeight') - scrollHeight;
      this.lastScrollTop += delta;
      this.$el.scrollTop(this.$el.scrollTop() + delta);
    },

    needsBelow: function () {
      var $el = this.$el;
      var scrollHeight = $el.prop('scrollHeight');
      var scrollTop = $el.scrollTop();
      var height = $el.outerHeight();
      return scrollHeight <= this.threshold + scrollTop + height;
    },

    renderBelow: function () {
      var collection = this.collection;
      var available = this.available;
      var pageSize = this.pageSize();
      var edge = collection.last();
      var target = edge.date().clone().add('days', pageSize);
      var targetId = Day.id(target);
      available.fill(edge.date(), target);
      var i = available.indexOf(available.get(targetId));
      collection.add(available.models.slice(i - pageSize + 1, i + 1));
    },

    extraBelow: function () {
      var $el = this.$el;
      var scrollHeight = $el.prop('scrollHeight');
      var scrollTop = $el.scrollTop();
      var height = this.$el.outerHeight();
      var lastHeight = this.$el.children().last().outerHeight();
      return scrollHeight > this.threshold + scrollTop + height + lastHeight;
    },

    removeBelow: function () {
      this.collection.remove(this.collection.last(this.pageSize()));
    },

    remove: function () {
      $(window).off('resize', this.padAndTrim);
      return ListView.prototype.remove.apply(this, arguments);
    },

    padAndTrim: function () {

      // Don't try to pad/trim while the user could be scrolling with the scroll
      // bar. It causes massive jankness.
      if (this.mousedown) return this.padAndTrimCalled = true;
      this.padAndTrimCalled = false;

      // Add or remove elements below if necessary.
      if (this.needsBelow()) do this.renderBelow(); while (this.needsBelow());
      else while (this.extraBelow()) this.removeBelow();

      // Add or remove elements above if necessary.
      if (this.needsAbove()) do this.renderAbove(); while (this.needsAbove());
      else while (this.extraAbove()) this.removeAbove();
    },

    date: function (date) {
      return date ? this.jumpTo(date) : this.calculateDate();
    },

    jumpTo: function (date) {
      var pageSize = this.pageSize();
      var available = this.available;
      date = this.view === 'list' ? date : date.clone().startOf('week');
      available.fill(date, date.clone().add('days', pageSize));
      var i = available.indexOf(available.get(Day.id(date)));
      this.collection.set(available.models.slice(i, i + pageSize));
      this.padAndTrim();
    },

    calculateDate: function () {
      var date = this.collection.find(function (day) {
        var view = this.views[day.cid];
        if ($.contains(this.el, view.el)) {
          var top = view.$el.position().top;
          if (this.view === 'month') return top >= 0;
          if (this.view === 'list') return top + view.$el.outerHeight() > 0;
        }
      }, this);
      return date ? date.date() : moment(0).tz(this.available.tz);
    },

    setView: function (view, date) {
      if (view === this.view && Day.id(date) === Day.id(this.date())) return;
      this.view = view;
      this.date(date);
    },

    onMousedown: function () { this.mousedown = true; },

    onMouseup: function () {
      this.mousedown = false;
      if (this.padAndTrimCalled) this.padAndTrim();
    }
  });
})();

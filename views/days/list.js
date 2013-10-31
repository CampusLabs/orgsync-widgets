//= require ../list
//= require ./show

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = window.jQuery;
  var _ = window._;
  var Day = app.Day;
  var EventDate = app.EventDate;
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
      this.setView(this.view, this.initialDate);
      ListView.prototype.initialize.apply(this, arguments);
    },

    pageSize: function () {
      return this.view === 'month' ? 7 : 1;
    },

    needsAbove: function () {
      if (this.view === 'list') {
        var edge = this.collection.first();
        if (!edge) return false;
        var prev = this.listStep(edge.date().clone().subtract('day', 1)).prev;
        if (prev === edge) return false;
      }
      return this.$el.scrollTop() < this.threshold;
    },

    renderAbove: function () {
      var collection = this.collection;
      var available = this.available;
      var pageSize = this.pageSize();
      var edge = collection.first();
      var target = edge.date().clone().subtract('days', pageSize);
      var scrollHeight = this.$el.prop('scrollHeight');
      switch (this.view) {
      case 'month':
        var targetId = Day.id(target);
        available.fill(target, edge.date());
        var i = available.indexOf(available.get(targetId));
        collection.add(available.models.slice(i, i + pageSize));
        break;
      case 'list':
        this.collection.add(this.listStep(target).prev);
      }
      var delta = this.$el.prop('scrollHeight') - scrollHeight;
      this.$el.scrollTop(this.$el.scrollTop() + delta);
    },

    extraAbove: function () {
      if (this.view === 'list') {
        var edge = this.collection.last();
        if (!edge) return false;
        var next = this.listStep(edge.date().clone().add('day', 1)).next;
        if (next === edge) return false;
      }
      var $el = this.$el;
      var scrollTop = $el.scrollTop();
      var firstHeight = $el.children().first().outerHeight();
      return scrollTop > this.threshold + firstHeight;
    },

    removeAbove: function () {
      var scrollHeight = this.$el.prop('scrollHeight');
      this.collection.remove(this.collection.first(this.pageSize()));
      var delta = this.$el.prop('scrollHeight') - scrollHeight;
      this.$el.scrollTop(this.$el.scrollTop() + delta);
    },

    needsBelow: function () {
      if (this.view === 'list') {
        var edge = this.collection.last();
        if (!edge) return false;
        var next = this.listStep(edge.date().clone().add('day', 1)).next;
        if (next === edge) return false;
      }
      var $el = this.$el;
      var scrollHeight = $el.prop('scrollHeight');
      var scrollTop = $el.scrollTop();
      var height = $el.outerHeight();
      return scrollHeight < scrollTop + height + this.threshold;
    },

    renderBelow: function () {
      var collection = this.collection;
      var available = this.available;
      var pageSize = this.pageSize();
      var edge = collection.last();
      var target = edge.date().clone().add('days', pageSize);
      switch (this.view) {
      case 'month':
        var targetId = Day.id(target);
        available.fill(edge.date(), target);
        var i = available.indexOf(available.get(targetId));
        collection.add(available.models.slice(i - pageSize + 1, i + 1));
        break;
      case 'list':
        collection.add(this.listStep(target).next);
      }
    },

    extraBelow: function () {
      if (this.view === 'list') {
        var edge = this.collection.first();
        if (!edge) return false;
        var prev = this.listStep(edge.date().clone().subtract('day', 1)).prev;
        if (prev === edge) return false;
      }
      var $el = this.$el;
      var scrollHeight = $el.prop('scrollHeight');
      var scrollTop = $el.scrollTop();
      var height = this.$el.outerHeight();
      var lastHeight = this.$el.children().last().outerHeight();
      return scrollHeight > scrollTop + height + this.threshold + lastHeight;
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
      switch (this.view) {
      case 'month':
        date = date.clone().startOf('week');
        available.fill(date, date.clone().add('days', pageSize));
        var i = available.indexOf(available.get(Day.id(date)));
        this.collection.set(available.models.slice(i, i + pageSize));
        break;
      case 'list':
        this.collection.set(this.listStep(date).next);
      }
      this.padAndTrim();
    },

    // The list view doesn't care about empty days, so this function is used to
    // determine what the next interesting (event-filled) days are.
    listStep: function (date) {
      var id = Day.id(date);
      var prev;
      var next = this.available.find(function (day) {
        if (!day.get('eventDates').length || !day.get('visible')) return;
        if (day.id <= id) prev = day;
        return day.id >= id;
      });
      return {next: next || prev, prev: prev || next};
    },

    calculateDate: function () {
      var date = this.collection.find(function (day) {
        var $el = this.views[day.cid].$el;
        var top = $el.position().top;
        return this.view === 'month' ? top >= 0 : top + $el.outerHeight() > 0;
      }, this);
      return date ? date.date() : moment().tz(this.available.tz);
    },

    setView: function (view, date) {
      this.view = view;
      this.modelViewOptions = {view: view};
      this.collection.set();
      this.date(date);
    },

    onMousedown: function () { this.mousedown = true; },

    onMouseup: function () {
      this.mousedown = false;
      if (this.padAndTrimCalled) this.padAndTrim();
    },

    correctDisplay: function () {
      if (this.view === 'list') return;
      this.collection.each(function (day) {
        this.views[day.cid].correctDisplay();
      }, this);
    }
  });
})();

import $ from 'jquery';
import _ from 'underscore';
import ListView from 'views/list';
import DaysShowView from 'views/days/show';
module Day from 'entities/day';
module EventDate from 'entities/event-date';
import moment from 'my-moment';

export default ListView.extend({
  threshold: 800,

  view: 'month',

  modelView: DaysShowView,

  options: [
    'threshold',
    'pageSize',
    'view',
    'initialDate',
    'fetchedEvents',
    'eventFilters'
  ],

  events: {
    scroll: 'padAndTrim',
    mousedown: 'onMousedown',
    mouseup: 'onMouseup'
  },

  listeners: {
    collection: {add: 'debouncedCheckFetch'}
  },

  initialize: function () {
    _.bindAll(this, 'padAndTrim');
    $(window).on('resize', this.padAndTrim);
    this.debouncedCheckFetch = _.debounce(this.checkFetch, 1000);
    this.debouncedOnMouseup = _.debounce(this.onMouseup, 1000);
    this.available = this.collection;
    this.collection = new Day.Collection();
    this.collection.tz = this.available.tz;
    this.setView(this.view, this.initialDate);
    ListView.prototype.initialize.apply(this, arguments);
  },

  pageSize: function () {
    return this.view === 'list' ? 1 : 7;
  },

  needsAbove: function () {
    if (this.topEdge()) return false;
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
    case 'week':
      var targetId = Day.Model.id(target);
      available.fill(target, edge.date());
      var i = available.indexOf(available.get(targetId));
      collection.add(available.models.slice(i, i + pageSize));
      break;
    case 'list':
      this.collection.add(this.listStep(target).prev);
    }
    this.adjustAbove(scrollHeight);
  },

  extraAbove: function () {
    if (this.bottomEdge()) return false;
    var $el = this.$el;
    var scrollTop = $el.scrollTop();
    var firstHeight = $el.children().first().outerHeight();
    return scrollTop > this.threshold + firstHeight;
  },

  removeAbove: function () {
    var scrollHeight = this.$el.prop('scrollHeight');
    this.collection.remove(this.collection.first(this.pageSize()));
    this.adjustAbove(scrollHeight);
  },

  adjustAbove: function (scrollHeight) {
    var delta = this.$el.prop('scrollHeight') - scrollHeight;
    this.$el.scrollTop(this.$el.scrollTop() + delta);
  },

  needsBelow: function () {
    if (this.bottomEdge()) return false;
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
    case 'week':
      var targetId = Day.Model.id(target);
      available.fill(edge.date(), target);
      var i = available.indexOf(available.get(targetId));
      collection.add(available.models.slice(i - pageSize + 1, i + 1));
      break;
    case 'list':
      collection.add(this.listStep(target).next);
    }
  },

  extraBelow: function () {
    if (this.topEdge()) return false;
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

  topEdge: function () {
    if (this.view !== 'list') return false;
    var edge = this.collection.first();
    if (!edge) return true;
    var prev = this.listStep(edge.date().clone().subtract('day', 1)).prev;
    return prev === edge;
  },

  bottomEdge: function () {
    if (this.view !== 'list') return false;
    var edge = this.collection.last();
    if (!edge) return true;
    var next = this.listStep(edge.date().clone().add('day', 1)).next;
    return next === edge;
  },

  padAndTrim: function () {

    // Don't try to pad/trim while the user could be scrolling with the scroll
    // bar. It causes massive jankness.
    if (this.mousedown) {
      this.debouncedOnMouseup();
      this.padAndTrimCalled = true;
      return;
    }
    this.padAndTrimCalled = false;

    window.cancelAnimationFrame(this.afid);

    this.afid = window.requestAnimationFrame(_.bind(function () {

      // Add or remove elements below if necessary.
      if (this.needsBelow()) this.renderBelow();
      else if (this.needsAbove()) this.renderAbove();
      else if (this.extraBelow()) this.removeBelow();
      else if (this.extraAbove()) this.removeAbove();
      else return;

      this.padAndTrim();
    }, this));
  },

  date: function (date) {
    return date ? this.jumpTo(date) : this.calculateDate();
  },

  jumpTo: function (date) {
    var pageSize = this.pageSize();
    var available = this.available;
    switch (this.view) {
    case 'month':
    case 'week':
      date = date.clone().startOf('week');
      available.fill(date, date.clone().add('days', pageSize));
      var i = available.indexOf(available.get(Day.Model.id(date)));
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
    var id = Day.Model.id(date);
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
      return this.view === 'list' ? top + $el.outerHeight() > 0 : top >= 0;
    }, this);
    return date ? date.date() : moment().tz(this.available.tz);
  },

  setView: function (view, date) {
    this.view = view;
    this.modelViewOptions = {view: view, eventFilters: this.eventFilters};
    this.collection.set();
    this.date(date);
  },

  onMousedown: function () {
    this.mousedown = true;
    this.debouncedOnMouseup();
  },

  onMouseup: function () {
    this.mousedown = false;
    if (this.padAndTrimCalled) this.padAndTrim();
  },

  correctDisplay: function () {
    if (this.view === 'list') return;
    this.collection.each(function (day) {
      this.views[day.cid].correctDisplay();
    }, this);
  },

  checkFetch: function () {
    switch (this.view) {
    case 'list':
      var id = Day.Model.id(this.date());
      var prev;
      var next;
      this.available.find(function (day) {
        if (day.get('eventDates').length && day.get('visible')) {
          if (!prev) prev = day;
          next = day;
        }
        if (day.get('fetched') === Infinity) return;
        if (day.id <= id) prev = day;
        if (day.id >= id) return next = day;
      });
      if (this.collection.get(prev)) this.fetch(prev, 'before');
      if (this.collection.get(next)) this.fetch(next, 'after');
      break;
    case 'month':
    case 'week':
      var firstUnfetched = this.collection.find(function (day) {
        return day.get('fetched') < Infinity;
      });
      if (firstUnfetched) this.fetch(firstUnfetched, 'after');
    }
  },

  fetch: function (day, dir) {
    if (this.fetchedEvents.requestCount) return;
    var page = day.get('fetched') + 1;
    var self = this;
    var fetchKey = dir + 'FetchDay';
    this[fetchKey] = day;
    var limitKey = dir + 'Limit';
    var date = day.date();
    var limit = this[limitKey];
    if (limit) {
      if (dir === 'before' && !limit.isBefore(date)) return;
      if (dir === 'after' && !limit.isAfter(date)) return;
    }
    var data = {
      page: page === Infinity ? 1 : page,
      per_page: 100,
      upcoming: true
    };
    data[dir] = date.toISOString();
    this.fetchedEvents.fetch({
      remove: false,
      data: data,
      success: function (events, data) {
        if (!data.length) self[limitKey] = date;
        day.set('fetched', page);
        var newEventDates = new EventDate.Collection(
          _.flatten(_.map(data, function (event) {
            var eventDates = events.get(event.id).get('dates');
            return _.map(event.dates, function (date) {
              return eventDates.get(date.id);
            });
          }))
        );
        self.available.addEventDates(newEventDates);
        var last = newEventDates.last();
        var first = newEventDates.first();
        var startDate = first ? first.start().clone().startOf('day') : date;
        var endDate = last ? last.start().clone().startOf('day') : date;
        self.available.fill(
          startDate.isBefore(date) ? startDate : date,
          endDate.isAfter(date) ? endDate : date,
          true
        );
        if (self[fetchKey] === day) self.checkFetch();
      }
    });
  }
});

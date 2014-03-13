import $ from 'jquery';
import _ from 'underscore';
import ListView from 'views/list';
import DaysShowView from 'views/days/show';
module Day from 'entities/day';
module EventDate from 'entities/event-date';
import moment from 'moment-timezone';

export default ListView.extend({
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
    _.defer(_.bind(this.checkFetch, this));
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
    this.adjustAbove(1);
    this.padAndTrim();
  },

  extraAbove: function () {
    if (this.bottomEdge()) return false;
    var $el = this.$el;
    var scrollTop = $el.scrollTop();
    var firstHeight = $el.children().first().outerHeight();
    return scrollTop >= this.threshold + firstHeight;
  },

  removeAbove: function () {
    this.adjustAbove(-1);
    this.collection.remove(this.collection.first(this.pageSize()));
    this.padAndTrim();
  },

  adjustAbove: function (dir) {
    var firstHeight = this.$el.children().first().outerHeight();
    this.$el.scrollTop(this.$el.scrollTop() + dir * firstHeight);
  },

  needsBelow: function () {
    if (this.bottomEdge()) return false;
    var $el = this.$el;
    return this.bottom() < $el.scrollTop() + $el.outerHeight() + this.threshold;
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
    this.padAndTrim();
  },

  extraBelow: function () {
    if (this.topEdge()) return false;
    var $el = this.$el;
    var lastTop = $el.children().last()[0].offsetTop;
    return lastTop >= $el.scrollTop() + $el.outerHeight() + this.threshold;
  },

  removeBelow: function () {
    this.collection.remove(this.collection.last(this.pageSize()));
    this.padAndTrim();
  },

  remove: function () {
    $(window).off('resize', this.padAndTrim);
    return ListView.prototype.remove.apply(this, arguments);
  },

  bottom: function () {
    var $last = this.$el.children().last();
    return $last.length ? $last[0].offsetTop + $last.outerHeight() : 0;
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
      if (this.extraBelow()) this.removeBelow();
      else if (this.extraAbove()) this.removeAbove();
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
      var rows = this.view === 'month' ? 6 : 1;
      date = date.clone().startOf('month').startOf('week');
      available.fill(date, date.clone().add('days', pageSize * rows));
      var i = available.indexOf(available.get(Day.Model.id(date)));
      this.collection.set(available.models.slice(i, i + (pageSize * rows)));
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
    this.threshold = view === 'list' ? 800 : 0;
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
      var beforeAndAfter = _.partition(
        this.available.where({visible: true}),
        function (day) { return day.id < id; }
      );
      var before = beforeAndAfter[0].reverse();
      var after = beforeAndAfter[1];
      if (!before.length && after.length) before.push(_.first(after));
      if (!after.length && before.length) after.push(_.first(before));
      var unfilled = function (day) { return day.get('fetched') !== Infinity; };
      var prev = _.find(before, unfilled) || _.last(before);
      var next = _.find(after, unfilled) || _.last(after);
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

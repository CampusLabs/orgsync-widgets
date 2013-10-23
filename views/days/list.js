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
    pageSize: 14,

    threshold: 500,

    lastScrollTop: -Infinity,

    view: 'month',

    modelView: app.DaysShowView,

    options: [
      'threshold',
      'pageSize',
      'view',
      'initial'
    ],

    events: {
      scroll: 'debouncedTryPaging'
    },

    listeners: {},

    initialize: function () {
      this.debouncedTryPaging = _.debounce(_.bind(this.tryPaging, this, null));
      $(window).on('resize', this.debouncedTryPaging);
      this.available = this.collection;
      this.available.fill();
      this.available.on('add', this.debouncedTryPaging);
      this.collection = new this.available.constructor(
        this.available.first(this.pageSize)
      );
      this.on('all', console.log.bind(console));
      return ListView.prototype.initialize.apply(this, arguments);
    },

    tryPaging: function (day) {
      if (this.needsPageBelow(day)) this.renderPageBelow(day);
      else if (this.needsPageAbove(day)) this.renderPageAbove(day);
      else return this.trigger('paged');
    },

    renderPageAbove: function () {
      var collection = this.collection;
      var available = this.available;
      var pageSize = this.pageSize;
      var edge = collection.first();
      var targetId = Day.id(edge.date().clone().subtract('days', pageSize));
      if (!available.get(targetId)) available.fillN(-pageSize);
      var scrollHeight = this.$el.prop('scrollHeight');
      var i = available.indexOf(available.get(targetId));
      collection.add(available.models.slice(i, i + pageSize));
      this.$el.scrollTop(
        this.$el.scrollTop() + (this.$el.prop('scrollHeight') - scrollHeight)
      );
    },

    renderPageBelow: function () {
      var collection = this.collection;
      var available = this.available;
      var pageSize = this.pageSize;
      var edge = collection.last();
      var targetId = Day.id(edge.date().clone().add('days', pageSize));
      if (!available.get(targetId)) available.fillN(pageSize);
      var i = available.indexOf(available.get(targetId));
      collection.add(available.models.slice(i - pageSize + 1, i + 1));
    },

    needsPageAbove: function (day) {
      if (!this.collection.length) return true;
      var oldestDate = this.collection.first().date();
      var force = day && oldestDate.isAfter(day);
      var sixMonthsAgo = this.day().clone().subtract('months', 6);
      return force || (
        this.$el.scrollTop() < this.threshold &&
        oldestDate.isAfter(sixMonthsAgo)
      );
    },

    needsPageBelow: function (day) {
      if (!this.collection.length) return true;
      var youngestDate = this.collection.last().date();
      var force = day && youngestDate.isBefore(day);
      var sixMonthsFromNow = this.day().clone().add('months', 6);
      return force || (
        this.needsPage() &&
        youngestDate.isBefore(sixMonthsFromNow)
      );
    },

    refresh: function () {
      this.page = 0;
      this.collection.set();
      this.nextPage();
    },

    remove: function () {
      $(window).off('resize', this.tryPaging);
      return ListView.prototype.remove.apply(this, arguments);
    },

    day: function () {
      if (!this._day) this._day = this.collection.first().date().clone();
      var day = this._day;
      var scrollTop = this.$el.scrollTop();
      var lastScrollTop = this.lastScrollTop;
      if (lastScrollTop !== scrollTop) {
        this.lastScrollTop = scrollTop;
        var dir = scrollTop < lastScrollTop ? -1 : 1;
        var dirName = dir === 1 ? 'next' : 'prev';
        var $el = this.$('.js-day-' + Day.id(day));
        var $prev, $gap;
        while (
          ($prev = $el) &&
          ($gap = $el[dirName + 'Until'](':visible')) &&
          ($el = ($gap.length ? $gap.last() : $el)[dirName]()) &&
          this.incrOver($el, $prev, dir)
        ) { day.add('day', dir * (1 + $gap.length)); }
      }
      return day;
    },

    jumpTo: function (day, duration) {
      var self = this;
      this.$elFor(day, function ($el) {
        if (!$el.is(':visible')) {

          // The specified day isn't visible so it can't be jumped to. The best
          // that can be done here is find the next visible day in the future.
          var $next = $el.nextUntil(':visible').last();
          $next = ($next[0] ? $next : $el).next();

          // If, however, the next visible day in the future is the day that is
          // being started at, flip the direction and search in the past.
          if ($next[0] === $el[0]) {
            $next = $el.prevUntil(':visible').last();
            $next = ($next[0] ? $next : $el).prev();
          }

          // Finally, if this is an edge with no next or prev elements, noop by
          // scrolling to the current day element.
          if ($next[0]) $el = $next;
        }

        // Math.round necessary for FF as it doesn't return integers.
        var target = function () {
          return Math.round($el.position().top) + self.$el.scrollTop();
        };
        self.$el.animate({scrollTop: target()}, {
          duration: duration || 0,
          step: function (now, tween) {
            var correct = target();
            if (tween.end === correct) return;
            tween.end = correct;
            tween.now = tween.start + ((tween.end - tween.start) * tween.pos);
          }
        });
      });
    },

    $elFor: function (day, cb) {
      var id = Day.id(day);
      var $el = this.$('.js-day-' + id);
      if ($el[0]) return cb($el);
      this.once('paged', _.bind(this.$elFor, this, day, cb));
      this.tryPaging(day);
    },

    incrOver: function ($el, $prev, dir) {
      if (!$el[0]) return false;

      // Math.round necessary for FF as it doesn't return integers.
      var top = Math.round($el.position().top);
      var list = this.view === 'list';
      if (dir === 1) return top < (list ? 1 : $prev.height());
      return top > -(list ? $el.height() : 1);
    }
  });
})();

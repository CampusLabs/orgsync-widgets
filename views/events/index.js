//= require ../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = window.jQuery;
  var _ = window._;
  var Community = app.Community;
  var Day = app.Day;
  var jst = window.jst;
  var moment = window.moment;
  var Portal = app.Portal;
  var View = app.View;

  app.selectorViewMap['.js-osw-events-index'] =
  app.EventsIndexView = View.extend({
    template: jst['events/index/index'],

    events: {
      'click .js-change-view': 'clickChangeView',
      'click .js-today': 'clickToday',
      'click .js-prev-month': function () { this.incr('month', -1); },
      'click .js-next-month': function () { this.incr('month', 1); },
      'click .js-prev-week': function () { this.incr('week', -1); },
      'click .js-next-week': function () { this.incr('week', 1); }
    },

    options: ['communityId', 'portalId', 'events', 'date', 'tz', 'view'],

    classes: [
      'orgsync-widget',
      'js-osw-events-index',
      'osw-events-index'
    ],

    tz: app.tz,

    lastScrollTop: -Infinity,

    view: 'month',

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      this.days = new Day.Collection();
      this.days.tz = this.tz;
      this.community = new Community({id: this.communityId});
      this.portal = new Portal({id: this.portalId});
      var events = this.community.get('events');
      var self = this;
      events.fetch({
        data: {per_page: 100},
        success: function (events) {
          self.days.addEvents(events);
          self.renderMonth();
        }
      });
      this.render();
    },

    render: function () {
      View.prototype.render.apply(this, arguments);
      this.renderDaysOfWeek();
      this.renderDaysList();
      this.setView(this.view);
      this.$('> .js-list').scroll(_.bind(this.renderMonth, this));
      return this;
    },

    renderDaysOfWeek: function () {
      var day = moment().tz(this.tz || app.tz).startOf('week');
      var $days = [];
      do { $days.push($('<div>').addClass('js-day').text(day.format('ddd'))); }
      while (day.add('day', 1).weekday());
      this.$('.js-days-of-week').append($days);
    },

    renderDaysList: function () {
      this.views.daysList = new app.ListView({
        el: this.$('.js-list'),
        collection: this.days,
        modelView: app.DaysShowView,
        pageSize: 7,
        infiniteScroll: true
      });
      this.views.daysList.once('done-paging', this.clickToday, this);
    },

    clickChangeView: function (ev) { this.setView($(ev.target).data('view')); },

    setView: function (view) {
      this.view = view;
      var day = this.day();
      this.$el
        .removeClass('js-list-view js-month-view')
        .addClass('js-' + view + '-view');
      if (this.days.length) this.views.daysList.nextPage();
      if (!day) return;
      delete this._day;
      this.lastScrollTop = -Infinity;
      this.jumpTo(view === 'list' ? day.weekday(0) : day);
      this.renderMonth();
    },

    day: function () {
      if (!this.days.length) return;
      if (!this._day) this._day = this.days.first().date().clone();
      var day = this._day;
      var scrollTop = this.$('> .js-list').scrollTop();
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

    incrOver: function ($el, $prev, dir) {
      if (!$el[0]) return false;

      // Math.round necessary for FF as it doesn't return integers.
      var top = Math.round($el.position().top);
      var list = this.view === 'list';
      if (dir === 1) return top < (list ? 1 : $prev.height());
      return top > -(list ? $el.height() : 1);
    },

    clickToday: function () { this.jumpTo(moment().tz(this.tz), 500); },

    incr: function (unit, n) {
      var day = this.day().clone();
      if (this.view === 'month') day.weekday(6);
      this.jumpTo(day.add(unit, n).startOf(unit), 500);
    },

    jumpTo: function (day, duration) {
      var $el = this.$('.js-day-' + Day.id(day));

      // Handle uncreated days here
      if (!$el[0]) return;

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
      var $list = this.$('> .js-list');

      // Math.round necessary for FF as it doesn't return integers.
      var target = Math.round($el.position().top) + $list.scrollTop();
      $list.animate({scrollTop: target}, duration || 0);
    },

    renderMonth: function () {
      var day = this.day();
      var monthView = this.view === 'month';
      if (monthView) day = day.clone().weekday(6);
      this.$('.js-month').text(day.format('MMMM'));
      this.$('.js-year').text(day.format('YYYY'));
      if (!monthView) return;
      var lastMonth = this.lastMonth;
      var month = day.format('YYYY-MM');
      if (month === lastMonth) return;
      this.lastMonth = month;
      this.$('.js-active-month').removeClass('js-active-month');
      this.$('.js-month-' + month).addClass('js-active-month');
    }
  });
})();

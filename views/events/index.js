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
    },

    clickChangeView: function (ev) { this.setView($(ev.target).data('view')); },

    setView: function (view) {
      this.view = view;
      var day = this.day();
      this.$el
        .removeClass('js-list-view js-month-view')
        .addClass('js-' + view + '-view');
      this.views.daysList.nextPage();
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
        var $gap;
        while (
          ($gap = $el[dirName + 'Until'](':visible')) &&
          ($el = ($gap.length ? $gap.last() : $el)[dirName]()) &&
          $el[0] &&
          dir * $el.position().top <= (dir === 1 ? 0 : $el.height())
        ) { day.add('day', dir * (1 + $gap.length)); }
      }
      return day;
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
        var $next = $el.nextUntil(':visible').last().next();
        var $last = $el.prevUntil(':visible').last().prev();
        $el = $next[0] ? $next : $last[0] ? $last : $el;
      }
      var $list = this.$('> .js-list');
      var target = $el.position().top + $list.scrollTop();
      $list.animate({scrollTop: target}, duration || 0);
    },

    renderMonth: function () {
      var day = this.day();
      var monthView = this.view === 'month';
      if (monthView) day = day.clone().add('w', 1).weekday(6);
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

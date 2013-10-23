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

    view: 'month',

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      this.days = new Day.Collection();
      this.days.tz = this.tz;
      this.community = new Community({id: this.communityId});
      this.portal = new Portal({id: this.portalId});
      this.render();
      var self = this;
      this.community.get('events').fetch({
        data: {per_page: 100},
        success: function (events) {
          self.days.addEvents(events);
          self.updateMonth();
        }
      });
    },

    setView: function (view) {
      var daysList = this.views.daysList;
      var day = daysList.day();
      this.view = view;
      this.$el
        .removeClass('js-list-view js-month-view')
        .addClass('js-' + view + '-view');
      daysList.tryPaging();
      if (!day) return;
      delete daysList._day;
      daysList.lastScrollTop = -Infinity;
      daysList.jumpTo(view === 'list' ? day.weekday(0) : day);
      this.updateMonth();
    },

    render: function () {
      View.prototype.render.apply(this, arguments);
      this.renderDaysOfWeek();
      this.renderDaysList();
      this.setView(this.view);
      return this;
    },

    renderDaysOfWeek: function () {
      var day = moment().tz(this.tz).startOf('week');
      var $days = [];
      do { $days.push($('<div>').addClass('js-day').text(day.format('ddd'))); }
      while (day.add('day', 1).weekday());
      this.$('.js-days-of-week').append($days);
    },

    renderDaysList: function () {
      this.days.add({id: Day.id(moment().tz(this.tz)), tz: this.tz});
      this.views.daysList = new app.DaysListView({
        el: this.$('.js-list'),
        collection: this.days,
        view: this.view
      });
      this.$('> .js-list').scroll(_.bind(this.updateMonth, this));
    },

    clickChangeView: function (ev) {
      this.setView($(ev.target).data('view'));
    },

    clickToday: function () {
      this.views.daysList.jumpTo(moment().tz(this.tz), 500);
    },

    incr: function (unit, n) {
      var day = this.views.daysList.day().clone();
      if (this.view === 'month') day.weekday(6);
      this.views.daysList.jumpTo(day.add(unit, n).startOf(unit), 500);
    },

    updateMonth: function () {
      var day = this.views.daysList.day();
      var monthView = this.view === 'month';
      if (monthView) day = day.clone().weekday(6);
      this.$('.js-month').text(day.format('MMMM'));
      this.$('.js-year').text(day.format('YYYY'));
      if (!monthView) return;
      this.$('.js-active-month').removeClass('js-active-month');
      this.$('.js-month-' + day.format('YYYY-MM')).addClass('js-active-month');
    }
  });
})();

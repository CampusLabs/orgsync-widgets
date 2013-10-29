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
      'click .js-next-week': function () { this.incr('week', 1); },
      'keydown .js-search-input': 'searchKeydown',
      'change .js-month, .js-year': 'jumpToSelected'
    },

    options: ['communityId', 'portalId', 'date', 'tz', 'view'],

    classes: [
      'orgsync-widget',
      'js-osw-events-index',
      'osw-events-index',
      'js-month-view'
    ],

    tz: app.tz,

    view: 'month',

    filters: {
      query: ''
    },

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      this.days = new Day.Collection();
      this.days.tz = this.tz;
      this.community = new Community({id: this.communityId});
      this.portal = new Portal({id: this.portalId});
      this.render();
      var self = this;
      this.filters = _.clone(this.filters);
      this.updateFiltered = _.debounce(_.bind(this.updateFiltered, this));
      this.community.get('events').fetch({
        data: {per_page: 100},
        success: function (events) {
          self.days.addEvents(events);
          if (self.view === 'list') {
            self.date(self.date());
            self.updateMonth();
          }
          self.updateFiltered();
        }
      });
    },

    setView: function (view) {
      var date = view === 'list' ? this.date().clone().weekday(0) : this.date();
      this.view = view;
      this.$el
        .removeClass('js-list-view js-month-view')
        .addClass('js-' + view + '-view');
      this.views.daysList.setView(view, date);
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
      var day = this.date().startOf('week');
      var $days = [];
      do { $days.push($('<div>').addClass('js-day').text(day.format('ddd'))); }
      while (day.add('day', 1).weekday());
      this.$('.js-days-of-week').append($days);
    },

    renderDaysList: function () {
      var $list = this.$('> .js-list');
      this.views.daysList = new app.DaysListView({
        el: $list,
        collection: this.days,
        view: this.view,
        initialDate: this.date()
      });
      $list.scroll(_.bind(this.updateMonth, this));
    },

    clickChangeView: function (ev) {
      this.setView($(ev.target).data('view'));
    },

    clickToday: function () {
      this.date(moment().tz(this.tz), 500);
    },

    incr: function (unit, n) {
      var day = this.date().clone();
      if (this.view === 'month') day.weekday(6);
      this.date(day.add(unit, n).startOf(unit), 500);
    },

    updateMonth: function () {
      var date = this.date();
      var monthView = this.view === 'month';
      if (monthView) date = date.clone().weekday(6);
      this.$('.js-month').val(date.month());
      this.$('.js-year').html(this.yearOptions()).val(date.year());
      if (!monthView) return;
      var id = date.format('YYYY-MM');
      this.$('.js-current-month').removeClass('js-current-month');
      this.$('.js-month-' + id).addClass('js-current-month');
    },

    monthOptions: function () {
      var date = this.date();
      var thisMonth = date.month();
      var range = _.range(0, 12);
      return $('<div>').html(_.map(range, function (month) {
        return $('<option>')
          .attr('value', month)
          .text(date.month(month).format('MMMM'))
          .attr('selected', month === thisMonth);
      })).html();
    },

    date: function (date) {
      if (!this.views.daysList) return moment().tz(this.tz);
      return this.views.daysList.date(date);
    },

    yearOptions: function () {
      var anchorYear = this.date().year();
      var range = _.range(anchorYear - 3, anchorYear + 4);
      return $('<div>').html(_.map(range, function (year) {
        return $('<option>')
          .attr('value', year)
          .text(year)
          .attr('selected', year === anchorYear);
      })).html();
    },

    searchKeydown: function () {
      _.defer(_.bind(this.updateQueryFilter, this));
    },

    updateQueryFilter: function () {
      var q = this.$('.js-search-input').val();
      var words = _.str.words(q.toLowerCase());
      if (_.isEqual(words, this.lastWords)) return;
      this.lastWords = words;
      this.filters.query = words.length ? q : null;
      this.updateFiltered();
    },

    updateFiltered: function () {
      var query = this.filters.query;
      var date = this.date();
      this.community.get('events').each(function (event) {
        event.set('visible', event.matchesQuery(query));
      });
      if (this.view === 'list') this.date(date);
      this.views.daysList.correctDisplay();
    },

    jumpToSelected: function () {
      var month = +this.$('.js-month').val() + 1;
      if (month < 10) month = '0' + month;
      var year = this.$('.js-year').val();
      var date = moment.tz(year + '-' + month + '-01', this.tz);
      this.date(date);
      this.updateMonth();
    },

    tzDisplay: function () {
      var full = this.tz.replace(/^.*?\//, '').replace(/_/g, ' ');
      var abbr = this.date().zoneAbbr();
      return full + ' Time (' + abbr + ')';
    }
  });
})();

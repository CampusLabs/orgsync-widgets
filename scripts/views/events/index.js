//= require ../view.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = window.jQuery;
  var _ = window._;
  var Community = app.Community;
  var Day = app.Day;
  var Event = app.Event;
  var EventFilter = app.EventFilter;
  var JST = window.JST;
  var moment = window.moment;
  var Portal = app.Portal;
  var View = app.View;

  app.selectorViewMap['.js-osw-events-index'] =
  app.EventsIndexView = View.extend({
    template: JST['jst/events/index'],

    events: {
      'click .js-change-view': 'clickChangeView',
      'click .js-today': 'clickToday',
      'click .js-prev-month': function () { this.incr('month', -1); },
      'click .js-next-month': function () { this.incr('month', 1); },
      'click .js-toggle-filters': 'toggleFilters',
      'keydown .js-search-input': 'searchKeydown',
      'change .js-month, .js-year': 'jumpToSelected',
      'click .js-jump-to': 'jumpToClicked'
    },

    options: [
      'type',
      'id',
      'date',
      'tz',
      'view',
      'fetchedEvents',
      'eventFilters',
      'legendMode'
    ],

    classes: [
      'orgsync-widget',
      'js-osw-events-index',
      'osw-events-index',
      'js-month-view'
    ],

    tz: app.tz,

    view: 'month',

    listeners: {
      eventFilters: {'change:enabled': 'updateFiltered'},
      fetchedEvents: {sync: 'onFetchedEvents'}
    },

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      this.days = new Day.Collection();
      this.days.tz = this.tz;
      var needsFilters = !this.eventFilters;
      this.eventFilters = new EventFilter.Collection(this.eventFilters);
      this.fetchedEvents = (function (self) {
        switch (self.type) {
        case 'community':
          return (new Community({id: self.id})).get('events');
        case 'portal':
          return (new Portal({id: self.id})).get('events');
        default:
          var events = new Event.Collection();
          events.url = '/account/events';
          return events;
        }
      })(this);
      if (needsFilters) {
        this.eventFilters.url = _.result(this.fetchedEvents, 'url') +
          '/filters';
        this.eventFilters.fetch();
      }
      this.render();
    },

    setView: function (view, date) {
      if (!date) {
        date = view === 'list' ? this.date().clone().weekday(0) : this.date();
      }
      this.view = view;
      this.$el
        .removeClass('js-list-view js-month-view js-week-view')
        .addClass('js-' + view + '-view');
      this.views.daysList.setView(view, date);
      this.updateMonth();
      this.updateFilterText();
    },

    render: function () {
      View.prototype.render.apply(this, arguments);
      this.renderEventFiltersList();
      this.renderDaysOfWeek();
      this.renderDaysList();
      this.setView(this.view);
      return this;
    },

    renderDaysOfWeek: function () {
      var day = this.date().startOf('week');
      var $days = [];
      do $days.push($('<div>').addClass('js-day').text(day.format('ddd')));
      while (day.add('day', 1).weekday());
      this.$('.js-days-of-week').append($days);
    },

    renderEventFiltersList: function () {
      this.views.eventFiltersList = new app.ListView({
        el: this.$('.js-event-filters-list'),
        collection: this.eventFilters,
        modelView: app.EventFiltersShowView,
        modelViewOptions: {legendMode: this.legendMode}
      });
    },

    renderDaysList: function () {
      var $list = this.$('.js-events-list');
      this.views.daysList = new app.DaysListView({
        el: $list,
        collection: this.days,
        view: this.view,
        initialDate: this.date(),
        fetchedEvents: this.fetchedEvents,
        eventFilters: this.eventFilters
      });
      $list.scroll(_.throttle(_.bind(this.updateMonth, this, false), 100));
    },

    clickChangeView: function (ev) {
      this.setView($(ev.target).data('view'));
    },

    clickToday: function () {
      this.date(moment().tz(this.tz), 500);
    },

    incr: function (unit, n) {
      var day = this.date().clone();
      if (this.view !== 'list') day.weekday(6);
      this.date(day.add(unit, n).startOf(unit), 500);
    },

    updateMonth: function (force) {
      var date = this.date();
      if (this.view !== 'list') date = date.clone().weekday(6);
      var month = date.month();
      if (force || month !== this.lastMonth) {
        this.$('.js-month').val(date.month());
        this.lastMonth = month;
      }
      var year = date.year();
      if (force || year !== this.lastYear) {
        this.updateYearOptions(year);
        this.$('.js-year').val(year);
        this.lastYear = year;
      }
    },

    updateYearOptions: function (year) {
      var $options = this.$('.js-year > option');
      _.each(_.range(year - 3, year + 4), function (n, i) {
        $options.eq(i).attr('value', n).text(n);
      });
    },

    date: function (date) {
      return this.views.daysList ?
        this.views.daysList.date(date) :
        moment().tz(this.tz);
    },

    searchKeydown: function () {
      _.defer(_.bind(this.updateQueryFilter, this));
    },

    updateQueryFilter: function () {
      var q = this.$('.js-search-input').val();
      var words = _.str.words(q.toLowerCase());
      if (_.isEqual(words, this.lastWords)) return;
      this.lastWords = words;
      this.query = words.length ? q : null;
      this.updateFiltered();
    },

    updateFiltered: function () {
      window.requestAnimationFrame(_.bind(function () {
        var eventFilters = this.eventFilters;
        var query = this.query;
        var date = this.date();
        this.fetchedEvents.each(function (event) {
          var visible = event.matchesQuery(query);
          event.get('dates').each(function (eventDate) {
            eventDate.set(
              'visible',
              visible && eventDate.matchesEventFilters(eventFilters)
            );
          });
        });
        if (this.view === 'list') this.date(date);
        this.views.daysList.correctDisplay();
      }, this));
    },

    jumpToSelected: function () {
      var month = +this.$('.js-month').val() + 1;
      if (month < 10) month = '0' + month;
      var year = this.$('.js-year').val();
      var date = moment.tz(year + '-' + month + '-01', this.tz);
      this.date(date);
      this.updateMonth(true);
    },

    tzDisplay: function () {
      var full = this.tz.replace(/^.*?\//, '').replace(/_/g, ' ');
      var abbr = this.date().zoneAbbr();
      return full + ' Time (' + abbr + ')';
    },

    jumpToClicked: function (ev) {
      this.setView('list', moment.tz($(ev.target).data('date'), this.tz));
    },

    onFetchedEvents: function () {
      if (this.view === 'list') {
        this.date(this.date());
        this.updateMonth();
      }
      this.updateFiltered();
    },

    updateFilterText: function () {
      this.$('.js-toggle-filters').text(
        (this.$el.hasClass('js-full-width') ? 'Show ' : 'Hide ') +
        (this.legendMode ? 'Legend' : 'Filters')
      );
    },

    toggleFilters: function () {
      this.$el.toggleClass('js-full-width');
      this.updateFilterText();
    }
  });
})();

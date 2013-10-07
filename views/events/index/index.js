//= require ../../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = window.jQuery;
  var _ = window._;
  var Community = app.Community;
  var Day = app.Day;
  var jst = window.jst;
  var Portal = app.Portal;
  var View = app.View;

  app.selectorViewMap['.js-osw-events-index'] =
  app.EventsIndexView = View.extend({
    template: jst['events/index/index'],

    events: {
      'click .js-change-view': 'clickChangeView'
    },

    options: ['communityId', 'portalId', 'events', 'date', 'zone', 'view'],

    classes: [
      'orgsync-widget',
      'js-osw-events-index',
      'osw-events-index'
    ],

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      this.$el.append($('<div>').addClass('js-loading'));
      this.days = new Day.Collection();
      this.days.zone = this.zone;
      this.community = new Community({id: this.communityId});
      this.portal = new Portal({id: this.portalId});
      if (!this.view) this.view = 'list';
      var events = this.community.get('events');
      events.fetch({
        data: {per_page: 100},
        success: _.bind(this.days.addEvents, this.days)
      });
      this.render();
    },

    render: function () {
      View.prototype.render.apply(this, arguments);
      this.renderDaysList();
      this.setView(this.view);
      return this;
    },

    renderDaysList: function () {
      this.views.daysList = new app.ListView({
        el: this.$('.js-list'),
        collection: this.days,
        modelView: app.DaysShowView,
        infiniteScroll: true
      });
    },

    clickChangeView: function (ev) { this.setView($(ev.target).data('view')); },

    setView: function (view) {
      this.$el
        .removeClass('js-list-view js-month-view')
        .addClass('js-' + view + '-view');
      this.views.daysList.refresh();
    }
  });
})();

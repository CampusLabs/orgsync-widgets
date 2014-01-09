//= require ./show.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var _ = window._;
  var EventFilter = app.EventFilter;
  var Olay = window.Olay;
  var JST = window.JST;
  var EventDatesShowView = app.EventDatesShowView;

  app.EventDatesListItemView = EventDatesShowView.extend({
    template: JST['jst/event-dates/list-item'],

    events: {
      click: 'open'
    },

    options: function () {
      return (_.result(EventDatesShowView.prototype, 'options') || []).concat(
        ['eventFilters']
      );
    },

    classes: [
      'orgsync-widget',
      'js-osw-event-dates-list-item',
      'osw-event-dates-list-item'
    ],

    listeners: {
      model: {'change:visible': 'correctDisplay'}
    },

    toTemplate: function () {
      return _.extend(EventDatesShowView.prototype.toTemplate.call(this), {
        filler: this.model.get('filler')
      });
    },

    initialize: function () {
      EventDatesShowView.prototype.initialize.apply(this, arguments);
      this.correctDisplay();
    },

    open: function () {
      if (this.olay) return this.olay.show();
      (this.views.event = new app.EventDatesShowView({
        model: this.model,
        day: this.day
      })).render();
      (this.olay = new Olay(this.views.event.el)).show();
    },

    correctDisplay: function () {
      this.$el.toggleClass('js-none', !this.model.get('visible'));
      var event = this.model.get('event');
      this.$el.css({borderLeftColor: this.color().toHexString()});
      if (this.view !== 'list' &&
          (this.continues || this.continued || event.get('is_all_day'))
        ) {
        this.$el.css(
          'background',
          tinycolor.lighten(this.color(), 45).toHexString()
        );
      }
    },

    color: function () {
      var eventFilters = this.eventFilters;
      var eventFilterId = _.find(this.model.get('filters'), function (id) {
        var eventFilter = eventFilters.get(id);
        return eventFilter && eventFilter.get('enabled');
      });
      return (eventFilters.get(eventFilterId) || new EventFilter()).color();
    }
  });
})();

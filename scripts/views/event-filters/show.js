//= require ../view.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var JST = window.JST;
  var View = app.View;

  var iconMap = {
    organization: 'organization',
    service_organization: 'service',
    umbrella: 'umbrella',
    service_umbrella: 'service',
    featured: 'promote',
  };

  app.EventFiltersShowView = View.extend({
    tagName: 'label',

    template: JST['jst/event-filters/show'],

    classes: [
      'orgsync-widget',
      'js-osw-event-filters-show',
      'osw-event-filters-show'
    ],

    options: ['legendMode'],

    events: {
      'change .js-enabled': 'updateEnabled'
    },

    listeners: {
      model: {'change:color': 'updateColor'}
    },

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      if (this.legendMode) this.$el.addClass('js-legend-mode');
    },

    render: function () {
      View.prototype.render.apply(this, arguments);
      this.$el.prepend(app.$('<span>')
        .addClass('js-icon icon-' + iconMap[this.model.get('type')])
      );
      this.updateColor();
      return this;
    },

    updateEnabled: function () {
      this.model.set(
        'enabled',
        this.legendMode || this.$('.js-enabled').prop('checked')
      );
    },

    updateColor: function () {
      this.$('.js-icon').css({color: this.model.color().toHexString()});
    }
  });
})();

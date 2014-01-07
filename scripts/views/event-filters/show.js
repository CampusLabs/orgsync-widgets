//= require ../view.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var JST = window.JST;
  var View = app.View;

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

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      if (this.legendMode) this.$el.addClass('js-legend-mode');
    },

    updateEnabled: function () {
      this.model.set(
        'enabled',
        this.legendMode || this.$('.js-enabled').prop('checked')
      );
    }
  });
})();

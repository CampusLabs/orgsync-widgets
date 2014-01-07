//= require ../view.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var _ = window._;
  var View = app.View;
  var JST = window.JST;

  app.PortalsShowView = View.extend({
    className: 'js-osw-portals-show osw-portals-show',

    template: JST['jst/portals/show/index'],

    loadingTemplate: JST['jst/portals/show/loading'],

    errorTemplate: JST['jst/portals/show/error'],

    events: {
      'click .js-try-again': 'fetch'
    },

    classes: [
      'orgsync-widget',
      'js-osw-portals-show',
      'osw-portals-show'
    ],

    render: function () {
      if (this.model.get('description') !== void 0) {
        return View.prototype.render.apply(this, arguments);
      }
      return this.fetch();
    },

    fetch: function () {
      this.renderLoading();
      this.model.fetch({
        success: _.bind(this.render, this),
        error: _.bind(this.renderError, this)
      });
      return this;
    },

    renderLoading: function () {
      this.$el.html(this.loadingTemplate(this));
    },

    renderError: function () {
      this.$el.html(this.errorTemplate(this));
    }
  });
})();

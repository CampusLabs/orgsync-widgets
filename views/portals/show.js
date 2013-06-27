//= require ../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var _ = window._;
  var View = app.View;
  var jst = window.jst;

  app.PortalsShowView = View.extend({
    className: 'js-osw-portals-show osw-portals-show',

    template: jst['portals/show/index'],

    loadingTemplate: jst['portals/show/loading'],

    errorTemplate: jst['portals/show/error'],

    events: {
      'click .js-try-again': 'fetch'
    },

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

//= require ../../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var _ = window._;
  var Olay = window.Olay;
  var View = app.View;

  app.PortalsIndexListItemView = View.extend({
    tagName: 'li',

    className: 'js-list-item list-item',

    template: window.jst['portals/index/list-item'],

    events: {
      'click': 'open'
    },

    listeners: {
      model: {remove: 'checkRemove'}
    },

    initialize: function (options) {
      View.prototype.initialize.apply(this, arguments);
      _.extend(this, _.pick(options, 'action'));
    },

    open: function (ev) {
      if (this.action === 'redirect') return;
      ev.preventDefault();
      if (!this.olay) {
        this.views.show = new app.PortalsShowView({model: this.model});
        this.olay = new Olay(this.views.show.render().$el);
      }
      this.olay.show();
    },

    checkRemove: function (portal, collection) {
      if (collection === this.collection) this.remove();
    }
  });
})();

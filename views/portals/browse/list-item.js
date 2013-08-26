//= require ../../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var Olay = window.Olay;
  var View = app.View;

  app.PortalsBrowseListItemView = View.extend({
    tagName: 'li',

    className: 'js-list-item list-item',

    template: window.jst['portals/browse/list-item'],

    events: {
      'click': 'open'
    },

    listeners: {
      model: {remove: 'checkRemove'}
    },

    open: function () {
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

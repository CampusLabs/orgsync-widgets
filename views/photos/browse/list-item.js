//= require ../../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var Olay = window.Olay;
  var View = app.View;

  app.PhotosBrowseListItemView = View.extend({
    tagName: 'li',

    className: 'js-list-item list-item',

    template: window.jst['photos/browse/list-item'],

    events: {
      'click': 'open'
    },

    open: function () {
      if (this.olay) return this.olay.show();
      (this.olay = new Olay(
        (this.views.photosShow = new app.PhotosShowView({
          model: this.model
        })).render().$el, {preserve: true}
      )).show().$container.addClass('osw-photos-show-olay');
    }
  });
})();

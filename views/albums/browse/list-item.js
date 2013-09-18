//= require ../../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = window.jQuery;
  var _ = window._;
  var elementQuery = window.elementQuery;
  var Olay = window.Olay;
  var View = app.View;

  app.AlbumsBrowseListItemView = View.extend({
    tagName: 'li',

    className: 'js-list-item list-item',

    template: window.jst['albums/browse/list-item'],

    events: {
      'click': 'open'
    },

    fetched: function () {
      return this.model.get('photo_count') !== this.model.get('photos').length;
    },

    open: function () {
      if (this.olay) return this.olay.show();
      (this.olay = new Olay(
        (this.views.photosBrowse = new app.PhotosBrowseView({
          album: this.model
        })).$el.on('olay:show', function () {
          $(this).closest('.js-olay-container').scrollTop(0);
          _.defer(elementQuery);
        }), {preserve: true}
      )).show().$container.addClass('osw-photos-browse-olay');
    }
  });
})();

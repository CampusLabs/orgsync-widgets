//= require ../../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var _ = window._;
  var Olay = window.Olay;
  var View = app.View;

  app.AlbumsBrowseListItemView = View.extend({
    tagName: 'li',

    className: 'js-album-list-item album-list-item',

    template: window.jst['albums/browse/list-item']
  });
})();

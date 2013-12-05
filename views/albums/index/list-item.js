//= require ../../view.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = window.jQuery;
  var _ = window._;
  var elementQuery = window.elementQuery;
  var Olay = window.Olay;
  var View = app.View;

  app.AlbumsIndexListItemView = View.extend({
    tagName: 'li',

    className: 'js-list-item list-item',

    template: window.JST['jst/albums/index/list-item'],

    events: {
      click: 'select'
    },

    listeners: {
      model: {'change:selected': 'toggleOlay'}
    },

    options: ['portalId', 'action'],

    select: function () {
      if (this.action === 'redirect') return;
      this.collection.each(function (album) {
        album.set('selected', album === this.model);
      }, this);
      return false;
    },

    toggleOlay: function () {
      var album = this.model;
      var selected = album.get('selected');
      if (selected || this.olay) {
        if (!this.olay) {
          (this.views.photosIndex = new app.PhotosIndexView({album: album})).$el
            .addClass('js-olay-hide')
            .on('olay:show', function () {
              $(this).closest('.js-olay-container').scrollTop(0);
              _.defer(elementQuery);
            })
            .on('olay:hide', function () { album.set('selected', false); });
          (this.olay = new Olay(this.views.photosIndex.$el, {preserve: true}))
            .$container.addClass('osw-photos-index-olay');
        }
        this.olay[selected ? 'show' : 'hide']();
      }
    },

    remove: function () {
      if (this.olay) this.olay.destroy();
      return View.prototype.remove.apply(this, arguments);
    }
  });
})();

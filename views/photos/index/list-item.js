//= require ../../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = window.jQuery;
  var Olay = window.Olay;
  var View = app.View;

  app.PhotosIndexListItemView = View.extend({
    tagName: 'li',

    className: 'js-list-item list-item',

    template: window.jst['photos/index/list-item'],

    events: {
      click: 'select'
    },

    listeners: {
      model: {'change:selected': 'toggleOlay'}
    },

    options: ['action'],

    select: function () {
      if (this.action === 'redirect') return;
      this.collection.each(function (photo) {
        photo.set('selected', photo === this.model);
      }, this);
      return false;
    },

    toggleOlay: function () {
      var photo = this.model;
      var selected = photo.get('selected');
      if (selected || this.olay) {
        if (!this.olay) {
          (this.views.photosShow = new app.PhotosShowView({
            model: photo,
            action: this.action
          })).render().$el
            .on('olay:show', function () {
              $(this).closest('.js-olay-container').scrollTop(0);
            })
            .on('olay:hide', function () { photo.set('selected', false); });
          (this.olay = new Olay(this.views.photosShow.$el, {preserve: true}))
            .$container.addClass('osw-photos-show-olay');
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

//= require ../../view.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = window.jQuery;
  var _ = window._;
  var JST = window.JST;
  var View = app.View;

  var dirMap = {'37': -1, '39': 1};

  app.selectorViewMap['.js-osw-photos-index'] =
  app.PhotosIndexView = View.extend({
    template: JST['jst/photos/index/index'],

    options: ['album', 'albumId', 'action'],

    classes: [
      'orgsync-widget',
      'js-osw-photos-index',
      'osw-photos-index'
    ],

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      if (!this.album) this.album = new app.Album({id: this.albumId});
      this.photos = this.album.get('photos');
      this.$el.append($('<div>').addClass('js-loading'));
      this.album.fetch({
        success: _.bind(this.render, this),
        error: _.bind(this.$el.text, this.$el, 'Load failed...')
      });
      _.bindAll(this, 'onKeyDown');
      $(document).on('keydown', this.onKeyDown);
    },

    render: function () {
      View.prototype.render.apply(this, arguments);
      this.renderPhotoList();
      return this;
    },

    renderPhotoList: function () {
      this.views.photosList = new app.InfiniteListView({
        el: this.$('.js-list'),
        modelView: app.PhotosIndexListItemView,
        modelViewOptions: {action: this.action},
        collection: this.photos
      });
    },

    onKeyDown: function (ev) { this.dir(dirMap[ev.which]); },

    dir: function (dir) {
      var selected = this.photos.findWhere({selected: true});
      if (!dir || !selected || !this.album.get('selected')) return;
      selected.set('selected', false);
      var l = this.photos.length;
      var i = (l + this.photos.indexOf(selected) + dir) % l;
      var photosList = this.views.photosList;
      while (i >= photosList.collection.length) photosList.nextPage(true);
      this.photos.at(i).set('selected', true);
    },

    remove: function () {
      $(document).off('keydown', this.onKeyDown);
      return View.prototype.remove.apply(this, arguments);
    }
  });
})();

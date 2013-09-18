//= require ../../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = window.jQuery;
  var _ = window._;
  var jst = window.jst;
  var View = app.View;

  app.selectorViewMap['.js-osw-photos-browse'] =
  app.PhotosBrowseView = View.extend({
    template: jst['photos/browse/index'],

    noResultsTemplate: jst['photos/browse/no-results'],

    initialize: function (options) {
      this.$el.addClass('orgsync-widget osw-photos-browse');
      _.extend(this, _.pick(_.extend({}, this.$el.data(), options),
        'album',
        'albumId'
      ));
      if (!this.album) this.album = new app.Album({id: this.albumId});
      this.photos = this.album.get('photos');
      this.$el.append($('<div>').addClass('js-loading'));
      this.album.fetch({
        success: _.bind(this.render, this),
        error: _.bind(this.$el.text, this.$el, 'Load failed...')
      });
    },

    render: function () {
      View.prototype.render.apply(this, arguments);
      this.renderPhotoList();
      return this;
    },

    renderPhotoList: function () {
      this.views.photoList = new app.ListView({
        el: this.$('.js-list'),
        modelView: app.PhotosBrowseListItemView,
        collection: this.photos,
        infiniteScroll: true
      });
    }
  });
})();

//= require ../../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = window.jQuery;
  var _ = window._;
  var jst = window.jst;
  var View = app.View;

  app.selectorViewMap['.js-osw-albums-browse'] =
  app.AlbumsBrowseView = View.extend({
    template: jst['albums/browse/index'],

    noResultsTemplate: jst['albums/browse/no-results'],

    initialize: function (options) {
      this.$el.addClass('orgsync-widget osw-albums-browse');
      _.extend(this, _.pick(_.extend({}, this.$el.data(), options),
        'portalId'
      ));
      this.portal = new app.Portal({id: this.portalId});
      this.albums = this.portal.get('albums');
      this.$el.append($('<div>').addClass('js-loading'));
      this.albums.fetch({
        success: _.bind(this.render, this),
        error: _.bind(this.$el.text, this.$el, 'Load failed...')
      });
    },

    render: function () {
      View.prototype.render.apply(this, arguments);
      this.renderAlbumList();
      return this;
    },

    renderAlbumList: function () {
      this.views.albumList = new app.ListView({
        el: this.$('.js-album-list'),
        modelView: app.AlbumsBrowseListItemView,
        collection: this.albums,
        infiniteScroll: true,
        pageSize: 20
      });
    }
  });
})();

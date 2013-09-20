//= require ../../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = window.jQuery;
  var _ = window._;
  var jst = window.jst;
  var View = app.View;

  app.selectorViewMap['.js-osw-albums-index'] =
  app.AlbumsIndexView = View.extend({
    template: jst['albums/index/index'],

    noResultsTemplate: jst['albums/index/no-results'],

    initialize: function (options) {
      this.$el.addClass('orgsync-widget osw-albums-index');
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
        el: this.$('.js-list'),
        modelView: app.AlbumsIndexListItemView,
        collection: this.albums,
        infiniteScroll: true
      });
    }
  });
})();

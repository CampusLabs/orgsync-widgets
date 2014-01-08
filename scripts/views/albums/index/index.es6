import $ from 'jquery';
import _ from 'underscore';
import {selectorViewMap} from 'app';
import BaseView from 'views/base';
import Portal from 'models/portal';
import InfiniteListView from 'views/infinite-list';
import AlbumsIndexListItemView from 'views/albums/index/list-item';
import AlbumsIndexTemplate from 'jst/albums/index/index';

var dirMap = {'37': -1, '39': 1};

export default =
selectorViewMap['.js-osw-albums-index'] =
BaseView.extend({
  template: AlbumsIndexTemplate,

  options: ['portalId', 'action'],

  classes: [
    'orgsync-widget',
    'js-osw-albums-index',
    'osw-albums-index'
  ],

  initialize: function () {
    BaseView.prototype.initialize.apply(this, arguments);
    this.portal = new Portal({id: this.portalId});
    this.albums = this.portal.get('albums');
    this.$el.append($('<div>').addClass('js-loading'));
    this.albums.pagedFetch({
      success: _.bind(this.render, this),
      error: _.bind(this.$el.text, this.$el, 'Load failed...')
    });
    _.bindAll(this, 'onKeyDown');
    $(document).on('keydown', this.onKeyDown);
  },

  render: function () {
    BaseView.prototype.render.apply(this, arguments);
    this.renderAlbumList();
    return this;
  },

  renderAlbumList: function () {
    this.views.albumsList = new InfiniteListView({
      el: this.$('.js-list'),
      modelView: AlbumsIndexListItemView,
      modelViewOptions: {action: this.action},
      collection: this.albums
    });
  },

  onKeyDown: function (ev) { this.dir(dirMap[ev.which]); },

  dir: function (dir) {
    var selected = this.albums.findWhere({selected: true});
    if (!dir || !selected) return;
    if (selected.get('photos').findWhere({selected: true})) return;
    selected.set('selected', false);
    var l = this.albums.length;
    var i = (l + this.albums.indexOf(selected) + dir) % l;
    var albumsList = this.views.albumsList;
    while (i >= albumsList.collection.length) albumsList.nextPage(true);
    this.albums.at(i).set('selected', true);
  },

  remove: function () {
    $(document).off('keydown', this.onKeyDown);
    return BaseView.prototype.remove.apply(this, arguments);
  }
});

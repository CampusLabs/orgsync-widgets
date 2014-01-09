import $ from 'jquery';
import _ from 'underscore';
import BaseView from 'views/base';
import {selectorViewMap} from 'app';
import PhotosIndexView from 'jst/photos/index/index';
import Album from 'entities/album';
import InfiniteListView from 'views/infinite-list';
import PhotosIndexListItemView from 'views/photos/index/list-item';

var dirMap = {'37': -1, '39': 1};

export default
selectorViewMap['.js-osw-photos-index'] =
BaseView.extend({
  template: PhotosIndexView,

  options: ['album', 'albumId', 'action'],

  classes: [
    'orgsync-widget',
    'js-osw-photos-index',
    'osw-photos-index'
  ],

  toTemplate: function () {
    return {
      name: this.album.get('name'),
      count: this.album.get('photo_count')
    };
  },

  initialize: function () {
    BaseView.prototype.initialize.apply(this, arguments);
    if (!this.album) this.album = new Album.Model({id: this.albumId});
    this.photos = this.album.get('photos');
    this.$el.append($('<div>').addClass('js-loading'));
    this.photos.pagedFetch({
      success: _.bind(this.render, this),
      error: _.bind(this.$el.text, this.$el, 'Load failed...')
    });
    _.bindAll(this, 'onKeyDown');
    $(document).on('keydown', this.onKeyDown);
  },

  render: function () {
    BaseView.prototype.render.apply(this, arguments);
    this.renderPhotoList();
    return this;
  },

  renderPhotoList: function () {
    this.views.photosList = new InfiniteListView({
      el: this.$('.js-list'),
      modelView: PhotosIndexListItemView,
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
    return BaseView.prototype.remove.apply(this, arguments);
  }
});

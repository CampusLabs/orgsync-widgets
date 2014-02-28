import $ from 'jquery';
import _ from 'underscore';
import elementQuery from 'elementQuery';
import {Olay} from 'app';
import BaseView from 'views/base';
import PhotosIndexView from 'views/photos/index/index';
import AlbumsIndexListItemTemplate from 'jst/albums/index/list-item';

export default BaseView.extend({
  tagName: 'li',

  className: 'js-list-item list-item',

  template: AlbumsIndexListItemTemplate,

  events: {
    click: 'select'
  },

  listeners: {
    model: {'change:selected': 'toggleOlay'}
  },

  options: ['portalId', 'action'],

  toTemplate: function () {
    var model = this.model;
    return {
      url: model.webUrl(),
      avatar: model.get('cover_photo'),
      name: model.get('name'),
      count: model.get('photo_count')
    };
  },

  render: function () {
    BaseView.prototype.render.apply(this, arguments);
    var $img = this.$('.image-container')
      .wrap($('<div>').addClass('js-stack-container'));
    $img.before(_.times(3, _.bind($img.clone, $img)));
    return this;
  },

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
        (this.views.photosIndex = new PhotosIndexView({album: album})).$el
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
    return BaseView.prototype.remove.apply(this, arguments);
  }
});

import $ from 'jquery';
import {Olay} from 'app';
import BaseView from 'views/base';
import PhotosShowView from 'views/photos/show';
import PhotosIndexListItemTemplate from 'jst/photos/index/list-item';

export default BaseView.extend({
  tagName: 'li',

  className: 'js-list-item list-item',

  template: PhotosIndexListItemTemplate,

  events: {
    click: 'select'
  },

  listeners: {
    model: {'change:selected': 'toggleOlay'}
  },

  options: ['action'],

  toTemplate: function () {
    var model = this.model;
    var count = model.get('comments_count');
    return {
      url: model.orgsyncUrl(),
      image: model.get('thumbnail_url'),
      count: count,
      isPlural: count !== 1
    };
  },

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
        (this.views.photosShow = new PhotosShowView({
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
    return BaseView.prototype.remove.apply(this, arguments);
  }
});

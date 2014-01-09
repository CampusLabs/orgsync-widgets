import BaseView from 'views/base';
import PhotosShowTemplate from 'jst/photos/show';
import InfiniteListView from 'views/infinite-list';
import CommentsShowView from 'views/comments/show';

export default BaseView.extend({
  template: PhotosShowTemplate,

  events: {
    'click img': 'next',
  },

  options: ['action'],

  classes: [
    'orgsync-widget',
    'js-osw-photos-show',
    'osw-photos-show'
  ],

  toTemplate: function () {
    var model = this.model;
    return {
      image: model.get('full_url'),
      description: model.get('description'),
      url: model.orgsyncUrl()
    };
  },

  initialize: function () {
    BaseView.prototype.initialize.apply(this, arguments);
    this.comments = this.model.get('comments');
    this.comments.url = this.model.get('links').comments;
    this.comments.fetch();
  },

  render: function () {
    BaseView.prototype.render.apply(this, arguments);
    this.views.commentsList = new InfiniteListView({
      el: this.$('.js-comments'),
      collection: this.comments,
      modelView: CommentsShowView,
      modelViewOptions: {tagName: 'li'}
    });
    return this;
  },

  next: function () {
    if (this.action === 'redirect') return;
    this.model.set('selected', false);
    var photos = this.model.collection;
    if (!photos) return;
    var i = (photos.indexOf(this.model) + 1) % photos.length;
    photos.at(i).set('selected', true);
  }
});

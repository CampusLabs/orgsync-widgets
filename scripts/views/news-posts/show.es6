import BaseView from 'views/base';
import NewsPostsShowTemplate from 'jst/news-posts/show';
import InfiniteListView from 'views/infinite-list';
import CommentsShowView from 'views/comments/show';

export default BaseView.extend({
  template: NewsPostsShowTemplate,

  classes: [
    'orgsync-widget',
    'js-osw-news-posts-show',
    'osw-news-posts-show'
  ],

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
  }
});

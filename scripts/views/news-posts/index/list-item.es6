import BaseView from 'views/base';
import NewsPostsIndexListItemTemplate from 'jst/news-posts/index/list-item';
import NewsPostsShowView from 'views/news-posts/show';
import {Olay} from 'app';

export default BaseView.extend({
  tagName: 'li',

  className: 'js-list-item list-item',

  template: NewsPostsIndexListItemTemplate,

  events: {
    'click a': 'show'
  },

  options: ['action', 'truncate'],

  truncate: 250,

  show: function (ev) {
    if (this.action === 'redirect') return;
    ev.preventDefault();
    var newsPost = this.model;
    if (!this.olay) {
      (this.views.newsPostsShow = new NewsPostsShowView({
        model: newsPost,
        action: this.action
      })).render();
      (this.olay = new Olay(this.views.newsPostsShow.$el, {preserve: true}))
        .$container.addClass('osw-news-post-show-olay');
    }
    this.olay.show();
  },

  remove: function () {
    if (this.olay) this.olay.destroy();
    return BaseView.prototype.remove.apply(this, arguments);
  }
});

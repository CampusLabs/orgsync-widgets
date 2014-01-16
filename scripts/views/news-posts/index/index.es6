import $ from 'jquery';
import _ from 'underscore';
import BaseView from 'views/base';
import NewsPostsIndexTemplate from 'jst/news-posts/index/index';
import NewsPostsIndexListItemView from 'views/news-posts/index/list-item';
import InfiniteListView from 'views/infinite-list';
import CommentsShowView from 'views/comments/show';
import {selectorViewMap} from 'app';
module Portal from 'entities/portal';

export default selectorViewMap['.js-osw-news-posts-index'] = BaseView.extend({
  template: NewsPostsIndexTemplate,

  options: ['portalId', 'action', 'limit', 'truncate'],

  classes: [
    'orgsync-widget',
    'js-osw-news-posts-index',
    'osw-news-posts-index'
  ],

  limit: 100,

  initialize: function () {
    BaseView.prototype.initialize.apply(this, arguments);
    this.portal = new Portal.Model({id: this.portalId});
    this.newsPosts = this.portal.get('newsPosts');
    this.$el.append($('<div>').addClass('js-loading'));
    this.newsPosts.fetch({
      limit: this.limit,
      data: {strip_html: false},
      success: _.bind(this.render, this),
      error: _.bind(this.$el.text, this.$el, 'Load failed...')
    });
  },

  render: function () {
    BaseView.prototype.render.apply(this, arguments);
    this.renderNewsPostsList();
    return this;
  },

  renderNewsPostsList: function () {
    var options = {};
    if (this.action) options.action = this.action;
    if (this.truncate) options.truncate = this.truncate;
    this.views.newsPostsList = new InfiniteListView({
      el: this.$('.js-list'),
      modelView: NewsPostsIndexListItemView,
      modelViewOptions: options,
      collection: this.newsPosts
    });
  }
});

//= require ../../view.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = window.jQuery;
  var _ = window._;
  var JST = window.JST;
  var View = app.View;


  app.selectorViewMap['.js-osw-news-posts-index'] =
  app.NewsPostsIndexView = View.extend({
    template: JST['jst/news-posts/index/index'],

    options: ['portalId', 'action', 'limit', 'truncate'],

    classes: [
      'orgsync-widget',
      'js-osw-news-posts-index',
      'osw-news-posts-index'
    ],

    limit: 100,

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      this.portal = new app.Portal({id: this.portalId});
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
      View.prototype.render.apply(this, arguments);
      this.renderNewsPostsList();
      return this;
    },

    renderNewsPostsList: function () {
      var options = {};
      if (this.action) options.action = this.action;
      if (this.truncate) options.truncate = this.truncate;
      this.views.newsPostsList = new app.InfiniteListView({
        el: this.$('.js-list'),
        modelView: app.NewsPostsIndexListItemView,
        modelViewOptions: options,
        collection: this.newsPosts
      });
    }
  });
})();

//= require ../../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = window.jQuery;
  var _ = window._;
  var jst = window.jst;
  var View = app.View;


  app.selectorViewMap['.js-osw-news-posts-index'] =
  app.NewsPostsIndexView = View.extend({
    template: jst['news-posts/index/index'],

    options: ['portalId', 'action'],

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      this.$el.addClass('orgsync-widget osw-news-posts-index');
      this.portal = new app.Portal({id: this.portalId});
      this.newsPosts = this.portal.get('newsPosts');
      this.$el.append($('<div>').addClass('js-loading'));
      this.newsPosts.fetch({
        data: {per_page: 100},
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
      this.views.newsPostsList = new app.ListView({
        el: this.$('.js-list'),
        modelView: app.NewsPostsIndexListItemView,
        modelViewOptions: {action: this.action},
        collection: this.newsPosts,
        infiniteScroll: true
      });
    }
  });
})();

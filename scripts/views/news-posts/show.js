//= require ../view.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var View = app.View;
  var JST = window.JST;

  app.NewsPostsShowView = View.extend({
    template: JST['jst/news-posts/show'],

    classes: [
      'orgsync-widget',
      'js-osw-news-posts-show',
      'osw-news-posts-show'
    ],

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      this.comments = this.model.get('comments');
      this.comments.url = this.model.get('links').comments;
      this.comments.fetch();
    },

    render: function () {
      View.prototype.render.apply(this, arguments);
      this.views.commentsList = new app.InfiniteListView({
        el: this.$('.js-comments'),
        collection: this.comments,
        modelView: app.CommentsShowView,
        modelViewOptions: {tagName: 'li'}
      });
      return this;
    }
  });
})();

//= require ../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var moment = window.moment;
  var View = app.View;
  var jst = window.jst;

  app.NewsPostsShowView = View.extend({
    className: 'js-osw-news-posts-show osw-news-posts-show orgsync-widget',

    template: jst['news-posts/show'],

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      this.comments = this.model.get('comments');
      this.comments.url = this.model.get('comments_url');
      this.comments.fetch();
    },

    render: function () {
      View.prototype.render.apply(this, arguments);
      this.views.commentsList = new app.ListView({
        el: this.$('.js-comments'),
        collection: this.comments,
        modelView: app.CommentsShowView,
        modelViewOptions: {tagName: 'li'},
        infiniteScroll: true
      });
      return this;
    },

    time: function () {
      return moment(this.model.get('created_at')).fromNow();
    }
  });
})();

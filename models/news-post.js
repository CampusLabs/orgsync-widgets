//= require model

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var Model = app.Model;

  var NewsPost = app.NewsPost = Model.extend({
    relations: {
      portal: {hasOne: 'Portal', fk: 'portal_id'},
      creator: {hasOne: 'Account', fk: 'creator_id'},
      comments: {hasMany: 'Comment', fk: 'news_post_id'}
    },

    orgsyncUrl: function () {
      return 'https://orgsync.com/' + this.get('portal').id + '/news_posts/' +
        this.id;
    }
  });

  NewsPost.Collection = Model.Collection.extend({
    model: NewsPost
  });
})();

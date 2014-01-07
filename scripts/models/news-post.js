//= require ./model.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = window.jQuery;
  var Model = app.Model;
  var moment = window.moment;

  var NewsPost = app.NewsPost = Model.extend({
    relations: {
      portal: {hasOne: 'Portal', fk: 'portal_id'},
      creator: {hasOne: 'Account', fk: 'creator_id'},
      comments: {hasMany: 'Comment', fk: 'news_post_id'}
    },

    orgsyncUrl: function () {
      return 'https://orgsync.com/' + this.get('portal').id + '/news_posts/' +
        this.id;
    },

    time: function () {
      return moment(this.get('created_at')).fromNow();
    },

    strippedBody: function () {
      return $($.parseHTML(this.get('body'))).text();
    },

    truncatedBody: function (length) {
      var body = this.strippedBody();
      var ellipsis = '...';
      var max = length - ellipsis.length;
      if (!length || body.length <= max) return body;
      return body.substring(0, max).replace(/[\s,.;]+\S*$/, '') + ellipsis;
    }
  });

  NewsPost.Collection = Model.Collection.extend({
    model: NewsPost
  });
})();

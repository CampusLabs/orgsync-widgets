import $ from 'jquery';
import Model from 'models/model';
import moment from 'moments';

var NewsPost = Model.extend({
  relations: {
    portal: {hasOne: 'portal', fk: 'portal_id'},
    creator: {hasOne: 'account', fk: 'creator_id'},
    comments: {hasMany: 'comment', fk: 'news_post_id'}
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

export default = NewsPost;

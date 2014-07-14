import $ from 'jquery';
import moment from 'moment';

import Base from 'entities/base';
import Portal from 'entities/portal';
import Account from 'entities/account';
import Comment from 'entities/comment';

var Model = Base.Model.extend({
  relations: {
    portal: {hasOne: Portal, fk: 'portal_id'},
    creator: {hasOne: Account, fk: 'creator_id'},
    comments: {hasMany: Comment, fk: 'news_post_id'}
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

var Collection = Base.Collection.extend({
  model: Model
});

export {Model, Collection};

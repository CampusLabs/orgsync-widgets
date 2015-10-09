import _ from 'underscore';
import api from 'api';
import Cursors from 'cursors';
import FetchList from 'components/ui/fetch-list';
import NewsPostsListItem from 'components/news-posts/list-item';
import React from 'react';

var PER_PAGE = 20;

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      newsPosts: []
    };
  },

  fetch: function (cb) {
    api.get('/portals/:portal_id/news', {
      portal_id: this.props.portalId,
      page: Math.floor(this.state.newsPosts.length / PER_PAGE) + 1,
      per_page: PER_PAGE,
      strip_html: false
    }, _.partial(this.handleFetch, cb));
  },

  handleFetch: function (cb, er, res) {
    if (er) return cb(er);
    var newsPosts = _.chain(this.state.newsPosts.concat(res.data))
      .unique(_.property('id'))
      .map(function (newsPost) { return _.extend({comments: []}, newsPost); })
      .sortBy('created_at')
      .value()
      .reverse();
    this.update({newsPosts: {$set: newsPosts}});
    cb(null, res.data.length < PER_PAGE);
  },

  renderListItem: function (newsPost) {
    var i = this.state.newsPosts.indexOf(newsPost);
    return (
      <NewsPostsListItem
        key={newsPost.id}
        redirect={this.props.redirect}
        truncateLength={this.props.truncateLength}
        cursors={{newsPost: this.getCursor('newsPosts', i)}}
      />
    );
  },

  render: function () {
    return (
      <FetchList
        className='osw-news-posts-index'
        fetch={this.fetch}
        itemRenderer={this.renderListItem}
        items={this.state.newsPosts}
      />
    );
  }
});

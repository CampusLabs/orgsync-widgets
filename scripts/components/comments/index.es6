import $ from 'jquery';
import _ from 'underscore';
import api from 'api';
import Cursors from 'cursors';
import List from 'react-list';
import ListItem from 'components/comments/list-item';
import New from 'components/comments/new';
import React from 'react';

var PER_PAGE = 100;

export default React.createClass({
  mixins: [Cursors],

  fetch: function (cb) {
    api.get(this.props.url, {
      page: Math.floor(this.state.comments.length / PER_PAGE) + 1,
      per_page: PER_PAGE
    }, _.partial(this.handleFetch, cb));
  },

  handleFetch: function (cb, er, res) {
    if (er) return cb(er);
    this.update({comments: {
      $set: _.chain(this.state.comments.concat(res.data))
        .unique(_.property('id'))
        .sortBy(_.property('created_at'))
        .value()
    }});
    cb(null, res.data.length < PER_PAGE);
  },

  renderListItem: function (comment) {
    return <ListItem key={comment.id} comment={comment} />;
  },

  renderError: function (er) {
    return <div className='osw-inset-block'>{er}</div>;
  },

  render: function () {
    return (
      <div className='osw-comments-index'>
        <List
          items={this.state.comments}
          renderItem={this.renderListItem}
          renderEmpty={$.noop}
          renderLoading={$.noop}
          renderError={this.renderError}
          fetch={this.fetch}
        />
        <New url={this.props.newUrl} />
      </div>
    );
  }
});

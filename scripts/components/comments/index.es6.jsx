/** @jsx React.DOM */

import CommentsListItem from 'components/comments/list-item';
import List from 'components/list';
import React from 'react';

export default React.createClass({
  renderBlankSlate: function () {
    return <div className='blank-slate'>No one has commented yet.</div>;
  },

  renderListItem: function (comment) {
    return <CommentsListItem key={comment.id} comment={comment} />;
  },

  render: function () {
    return (
      <List
        className='comments-index'
        renderListItem={this.renderListItem}
        renderBlankSlate={this.renderBlankSlate}
        collection={this.props.comments}
      />
    );
  }
});

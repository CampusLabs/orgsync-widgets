/** @jsx React.DOM */

import CommentsBlankSlate from 'components/comments/blank-slate'
import CommentsListItem from 'components/comments/list-item';
import CommentsNew from 'components/comments/new';
import List from 'components/list';
import React from 'react';

export default React.createClass({
  renderBlankSlate: function () {
    return <CommentsBlankSlate />;
  },

  renderListItem: function (comment) {
    return <CommentsListItem key={comment.id} comment={comment} />;
  },

  renderLoading: function () {
    return <div className='osw-inset-block'>Loading...</div>;
  },

  renderError: function (er) {
    return <div className='osw-inset-block'>{er}</div>;
  },

  render: function () {
    return (
      <div className='osw-comments-index'>
        <List
          renderListItem={this.renderListItem}
          renderBlankSlate={this.renderBlankSlate}
          renderLoading={this.renderLoading}
          renderError={this.renderError}
          collection={this.props.comments}
        />
        <CommentsNew url={this.props.comments.owner.get('links').web} />
      </div>
    );
  }
});

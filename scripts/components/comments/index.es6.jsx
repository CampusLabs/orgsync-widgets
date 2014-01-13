/** @jsx React.DOM */

import BackboneMixin from 'mixins/backbone';
import CommentsListItem from 'components/comments/list-item';
import LoadingSpinner from 'components/loading-spinner';
import React from 'react';

export default React.createClass({
  mixins: [BackboneMixin],

  getBackboneModels: function () {
    return [this.props.comments];
  },

  componentWillMount: function () {
    if (!this.props.comments.areFetched) this.props.comments.pagedFetch();
  },

  listItems: function () {
    if (!this.props.comments.length) {
      if (this.state.loadCount || this.state.error) return;
      return <div className='blank-slate'>No one has commented yet.</div>;
    }
    return this.props.comments.map(function (comment) {
      return <CommentsListItem key={comment.id} comment={comment} />;
    }, this);
  },

  render: function () {
    return (
      <div className='comments-index'>
        {this.listItems()}
        {this.state.loadCount ? <LoadingSpinner /> : null}
        {this.state.error ? this.state.error : null}
      </div>
    );
  }
});

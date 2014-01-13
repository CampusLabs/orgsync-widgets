/** @jsx React.DOM */

import BackboneMixin from 'mixins/backbone';
import CommentsListItem from 'components/comments/list-item';
import React from 'react';

export default React.createClass({
  mixins: [BackboneMixin],

  getInitialState: function () {
    return {isLoading: false, error: null};
  },

  getBackboneModels: function () {
    return [this.props.comments];
  },

  componentWillMount: function () {
    if (!this.props.comments.areFetched) this.fetch();
  },

  fetch: function () {
    this.props.comments.areFetched = true;
    this.setState({isLoading: true, error: null});
    this.props.comments.pagedFetch({
      success: this.handleSuccess,
      error: this.handleError
    });
  },

  handleSuccess: function () {
    this.setState({isLoading: false, error: null});
  },

  handleError: function (photos, er) {
    this.props.comments.areFetched = false;
    this.setState({isLoading: false, error: er.toString()});
  },

  listItems: function () {
    if (!this.props.comments.length) {
      if (this.state.isLoading || this.state.error) return;
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
        {this.state.isLoading ? 'Loading...' : null}
        {this.state.error ? this.state.error : null}
      </div>
    );
  }
});

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
    this.props.comments.on({
      sync: this.handleSuccess,
      error: this.handleError
    }, this).fetch();
  },

  handleSuccess: function () {
    this.setState({isLoading: false, error: null});
  },

  handleError: function (photos, er) {
    this.setState({isLoading: false, error: er.toString()});
  },

  listItems: function () {
    if (!this.props.comments.length) {
      return <div className='blank-slate'>No one has commented yet.</div>;
    }
    return this.props.comments.map(function (comment) {
      return <CommentsListItem key={comment.id} comment={comment} />;
    }, this);
  },

  render: function () {
    if (this.state.isLoading) return <div>Loading...</div>;
    if (this.state.error) return <div>{this.state.error}</div>;
    return <div className='comments-index'>{this.listItems()}</div>;
  }
});

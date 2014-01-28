/** @jsx React.DOM */

import _ from 'underscore';
import React from 'react';

export default React.createClass({
  filters: function () {
    return _.pick(this.props, 'query', 'letter', 'umbrella', 'category');
  },

  renderMessage: function () {
    var any = _.any(this.filters());
    var l = this.props.portals.length;
    return 'Showing ' + (any ? '' : 'all ') + l + ' portal' +
      (l === 1 ? '' : 's') + (any ? ' matching ' : '.');
  },

  renderClearButtons: function () {
    return _.map(this.filters(), function (value, name) {
      if (!value) return null;
      return (
        <span
          key={name}
          type='button'
          className='button'
          onClick={_.partial(this.props.onClear, name)}
        >
          {value}
        </span>
      );
    }, this);
  },

  render: function () {
    return (
      <div className='portals-summary'>
        <div className='message'>{this.renderMessage()}</div>
        <div className='clear-buttons'>{this.renderClearButtons()}</div>
      </div>
    );
  }
});

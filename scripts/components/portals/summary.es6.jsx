/** @jsx React.DOM */

import _ from 'underscore';
import Icon from 'components/icon'
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
          className='osw-button'
          onClick={_.partial(this.props.onClear, name)}
        >
          {value}
          <Icon name='delete' />
        </span>
      );
    }, this);
  },

  render: function () {
    return (
      <div className='osw-portals-summary'>
        <div className='osw-message'>{this.renderMessage()}</div>
        <div className='osw-clear-buttons'>{this.renderClearButtons()}</div>
      </div>
    );
  }
});

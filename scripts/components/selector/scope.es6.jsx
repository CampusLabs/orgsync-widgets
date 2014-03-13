/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  handleClick: function () {
    this.props.onClick(this.props.scope);
  },

  getClassName: function () {
    return 'osw-selector-scope' + (this.props.selected ? ' osw-selected' : '');
  },

  render: function () {
    return (
      <div className={this.getClassName()} onClick={this.handleClick}>
        {this.props.scope.get('name')}
      </div>
    );
  }
});

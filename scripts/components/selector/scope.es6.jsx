/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  onClick: function () {
    this.props.onClick(this.props.scope);
  },

  render: function () {
    return (
      <div
        className={'selector-scope' + (this.props.selected ? ' selected' : '')}
        onClick={this.onClick}
      >
        {this.props.scope.get('name')}
      </div>
    );
  }
});

/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  onClick: function () {
    this.props.onClick(this.props.selectorItem);
  },

  render: function () {
    return (
      <div
        className=
          {'selector-result ' + (this.props.selected ? ' selected' : '')}
        onClick={this.onClick}
      >
        <div className='name'>{this.props.selectorItem.get('name')}</div>
      </div>
    );
  }
});

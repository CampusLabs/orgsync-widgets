/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  onRemoveClick: function () {
    this.props.onRemoveClick(this.props.selectorItem);
  },

  render: function () {
    return (
      <div className='selector-token'>
        <div
          className='remove icon-delete'
          onClick={this.onRemoveClick}
        />
        <div className='name'>{this.props.selectorItem.get('name')}</div>
      </div>
    );
  }
});

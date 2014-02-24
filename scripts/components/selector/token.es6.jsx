/** @jsx React.DOM */

import Icon from 'components/icon';
import React from 'react';

export default React.createClass({
  onRemoveClick: function () {
    this.props.onRemoveClick(this.props.selectorItem);
  },

  render: function () {
    return (
      <div className='selector-token'>
        <Icon className='remove' name='delete' onClick={this.onRemoveClick} />
        <div className='name'>{this.props.selectorItem.get('name')}</div>
      </div>
    );
  }
});

/** @jsx React.DOM */

import Icon from 'components/icon';
import React from 'react';

export default React.createClass({
  handleRemoveClick: function () {
    this.props.onRemoveClick(this.props.selectorItem);
  },

  render: function () {
    return (
      <div className='osw-selector-token'>
        <Icon
          className='osw-remove'
          name='delete'
          onClick={this.handleRemoveClick}
        />
        <div className='osw-name'>{this.props.selectorItem.get('name')}</div>
      </div>
    );
  }
});

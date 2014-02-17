/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  onClick: function () {
    this.props.onClick(this.props.selectorItem);
  },

  render: function () {
    return (
      <div className='selector-result' onClick={this.onClick}>
        {this.props.selectorItem.get('name')}
      </div>
    );
  }
});

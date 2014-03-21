/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  handleClick: function () {
    this.props.onClick(this.props.letter);
  },

  getInputClassName: function () {
    return 'osw-button' + (this.props.selected ? ' osw-selected' : '');
  },

  render: function () {
    return (
      <td className='osw-portals-letter-cell'>
        <input
          type='button'
          className={this.getInputClassName()}
          value={this.props.letter || 'All'}
          onClick={this.handleClick}
        />
      </td>
    );
  }
});



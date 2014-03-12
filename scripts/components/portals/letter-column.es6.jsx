/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  handleClick: function () {
    this.props.onClick(this.props.letter);
  },

  render: function () {
    return (
      <td className='letter-column'>
        <input
          type='button'
          className={'button' + (this.props.selected ? ' selected' : '')}
          value={this.props.letter || 'All'}
          onClick={this.handleClick}
        />
      </td>
    );
  }
});



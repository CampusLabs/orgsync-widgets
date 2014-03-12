/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  render: function () {
    return (
      <div className='field icon icon-magnify'>
        <input
          name='query'
          type='text'
          placeholder='Search by name or keyword'
          value={this.props.value}
          onChange={this.props.onChange}
          autoComplete='off'
        />
      </div>
    );
  }
});

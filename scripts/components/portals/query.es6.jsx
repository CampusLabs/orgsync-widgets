/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  render: function () {
    return (
      <div className='portals-query'>
        <input
          name='query'
          placeholder='Search by name or keyword'
          value={this.props.value}
          onChange={this.props.onChange}
          autoComplete='off'
        />
      </div>
    );
  }
});

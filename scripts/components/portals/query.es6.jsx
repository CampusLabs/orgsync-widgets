/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  render: function () {
    return (
      <div className='portals-query'>
        <input
          name='query'
          placeholder='Search by name or keyword'
          value={this.props.query}
          onChange={this.props.onChange}
        />
      </div>
    );
  }
});

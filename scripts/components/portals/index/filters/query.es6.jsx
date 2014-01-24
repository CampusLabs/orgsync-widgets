/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  render: function () {
    return (
      <div className='portals-index-filters-query'>
        <input
          name='query'
          value={this.props.query}
          onChange={this.props.onChange}
        />
      </div>
    );
  }
});

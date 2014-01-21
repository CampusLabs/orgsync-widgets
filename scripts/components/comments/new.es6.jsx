/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  render: function () {
    return (
      <div className='comments-new'>
        <a href={this.props.url}>Comment on OrgSync!</a>
      </div>
    );
  }
});

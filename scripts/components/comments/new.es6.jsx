/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  render: function () {
    return (
      <div className='osw-comments-new'>
        <a href={this.props.url} className='osw-button'>Comment on OrgSync!</a>
      </div>
    );
  }
});

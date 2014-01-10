/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  render: function () {
    var comment = this.props.comment;
    var creator = comment.get('creator');
    return (
      <div className='comments-list-item'>
        <div className='creator-avatar'>
          <img src={creator.get('picture_url')} />
        </div>
        <div className='info'>
          <div className='creator-name'>{creator.get('display_name')}</div>
          <div className='time'>{comment.time()}</div>
          <div className='content'>{comment.get('content')}</div>
        </div>
      </div>
    );
  }
});



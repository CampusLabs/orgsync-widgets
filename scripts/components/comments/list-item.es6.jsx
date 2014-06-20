/** @jsx React.DOM */

import React from 'react/addons';

export default React.createClass({
  render: function () {
    var comment = this.props.comment;
    var creator = comment.get('creator');
    return (
      <div className='osw-comments-list-item'>
        <div className='osw-creator-avatar'>
          <img src={creator.get('picture_url')} />
        </div>
        <div className='osw-info'>
          <div className='osw-creator-name'>{creator.get('display_name')}</div>
          <div className='osw-time'>{comment.time()}</div>
          <div className='osw-content'>{comment.get('content')}</div>
        </div>
      </div>
    );
  }
});



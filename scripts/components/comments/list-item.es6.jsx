/** @jsx React.DOM */

import moment from 'moment';
import React from 'react';

export default React.createClass({
  render: function () {
    var comment = this.props.comment;
    var creator = comment.creator;
    return (
      <div className='osw-comments-list-item'>
        <img
          className='osw-comments-list-item-creator-avatar'
          src={creator.picture_url}
        />
        <div className='osw-comments-list-item-info'>
          <div className='osw-comments-list-item-creator-name'>
            {creator.display_name}
          </div>
          <div className='osw-comments-list-item-content'>
            {comment.content}
          </div>
          <div className='osw-comments-list-item-time'>
            {moment(comment.created_at).fromNow()}
          </div>
        </div>
      </div>
    );
  }
});

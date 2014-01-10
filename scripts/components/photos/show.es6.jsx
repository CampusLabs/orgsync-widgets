/** @jsx React.DOM */

import CommentsIndex from 'components/comments/index';
import React from 'react';

export default React.createClass({
  render: function () {
    return (
      <div className='photos-show'>
        <div className='photo-title'>
          <img src={this.props.photo.get('full_url')} />
        </div>
        <CommentsIndex comments={this.props.photo.get('comments')} />
      </div>
    );
  }
});

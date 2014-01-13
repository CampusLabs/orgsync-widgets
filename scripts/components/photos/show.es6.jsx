/** @jsx React.DOM */

import CommentsIndex from 'components/comments/index';
import React from 'react';

export default React.createClass({
  handleImageClick: function () {
    if (this.props.onImageClick) this.props.onImageClick(this.props.photo);
  },

  render: function () {
    var photo = this.props.photo;
    return (
      <div className='photos-show'>
        <div className='image' onClick={this.handleImageClick}>
          <img src={photo.get('full_url')} />
        </div>
        <div className='description'>{photo.get('description')}</div>
        <div className='comments-header'>Comments</div>
        <CommentsIndex comments={photo.get('comments')} />
      </div>
    );
  }
});

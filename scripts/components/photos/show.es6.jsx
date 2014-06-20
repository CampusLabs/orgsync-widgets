/** @jsx React.DOM */

import CommentsIndex from 'components/comments/index';
import React from 'react/addons';

export default React.createClass({
  onImageClick: function () {
    if (this.props.onImageClick) this.props.onImageClick(this.props.photo);
  },

  render: function () {
    return (
      <div className='osw-photos-show'>
        <div className='osw-image' onClick={this.onImageClick}>
          <img src={this.props.photo.get('full_url')} />
        </div>
        <div className='osw-description'>
          {this.props.photo.get('description')}
        </div>
        <div className='osw-comments-header'>Comments</div>
        <CommentsIndex comments={this.props.photo.get('comments')} />
      </div>
    );
  }
});

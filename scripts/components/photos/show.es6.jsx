/** @jsx React.DOM */

import $ from 'jquery';
import CommentsIndex from 'components/comments/index';
import React from 'react';

export default React.createClass({
  render: function () {
    var photo = this.props.photo;
    return (
      <div className='photos-show'>
        <div className='image'><img src={photo.get('full_url')} /></div>
        <div className='description'>{photo.get('description')}</div>
        <div className='comments-header'>Comments</div>
        <CommentsIndex comments={photo.get('comments')} />
      </div>
    );
  }
});

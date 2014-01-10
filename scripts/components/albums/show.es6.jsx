/** @jsx React.DOM */

import PhotosIndex from 'components/photos/index';
import React from 'react';

export default React.createClass({
  render: function () {
    var album = this.props.album;
    return (
      <div className='albums-show'>
        <div className='info'>
          <div className='name'>{album.get('name')}</div>
          <div className='photo-count'>{album.get('photo_count')} Photos</div>
        </div>
        <PhotosIndex photos={album.get('photos')} />
      </div>
    );
  }
});

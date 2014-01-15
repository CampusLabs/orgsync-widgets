/** @jsx React.DOM */

import PhotosIndex from 'components/photos/index';
import React from 'react';

export default React.createClass({
  render: function () {
    return (
      <div className='albums-show'>
        <div className='info'>
          <div className='name'>{this.props.album.get('name')}</div>
          <div className='photo-count'>
            {this.props.album.get('photo_count')} Photos
          </div>
        </div>
        <PhotosIndex photos={this.props.album.get('photos')} />
      </div>
    );
  }
});

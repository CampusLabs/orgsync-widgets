/** @jsx React.DOM */

import PhotosIndex from 'components/photos/index';
import React from 'react';

export default React.createClass({
  render: function () {
    return (
      <div className='osw-albums-show'>
        <div className='osw-info'>
          <div className='osw-name'>{this.props.album.get('name')}</div>
          <div className='osw-photo-count'>
            {this.props.album.get('photo_count')} Photos
          </div>
        </div>
        <PhotosIndex photos={this.props.album.get('photos')} />
      </div>
    );
  }
});

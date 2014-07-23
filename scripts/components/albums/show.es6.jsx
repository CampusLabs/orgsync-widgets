/** @jsx React.DOM */

import PhotosIndex from 'components/photos/index';
import Cursors from 'cursors';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  render: function () {
    return (
      <div className='osw-albums-show'>
        <div className='osw-albums-show-info'>
          <div className='osw-albums-show-name'>{this.state.album.name}</div>
          <div className='osw-albums-show-photo-count'>
            {this.state.album.photo_count} Photos
          </div>
        </div>
        <PhotosIndex
          portalId={this.props.portalId}
          albumId={this.state.album.id}
          cursors={{
            photos: this.getCursor('album', 'photos'),
            activePhotoId: this.getCursor('activePhotoId')
          }}
        />
      </div>
    );
  }
});

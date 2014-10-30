import _ from 'underscore';
import Cursors from 'cursors';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  handleClick: function (ev) {
    if (this.props.redirect) return;
    ev.preventDefault();
    this.update({activeAlbumId: {$set: this.props.album.id}});
  },

  render: function () {
    var album = this.props.album;
    return (
      <a
        className='osw-albums-list-item'
        href={album.links.web}
        onClick={this.handleClick}
      >
        <div className='osw-albums-list-item-cover-photos-container'>
          {
            _.times(4, function (n) {
              return (
                <div className='osw-albums-list-item-cover-photo' key={n}>
                  <img src={album.cover_photo} />
                </div>
              );
            })
          }
        </div>
        <div className='osw-albums-list-item-name'>{album.name}</div>
        <div className='osw-albums-list-item-photo-count'>
          {album.photo_count + ' Photos'}
        </div>
      </a>
    );
  }
});

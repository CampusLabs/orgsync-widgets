/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  handleClick: function () {
    if (this.props.onClick) this.props.onClick(this.props.album);
  },

  render: function () {
    var album = this.props.album;
    return (
      <div class='album-list-item' onClick={this.handleClick}>
        <div className='thumbnail'><img src={album.get('cover_photo')} /></div>
        <div className='name'>{album.get('name')}</div>
        <div className='photo-count'>{album.get('photo_count')} Photos</div>
      </div>
    );
  }
});

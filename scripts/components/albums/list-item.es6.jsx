/** @jsx React.DOM */

import _ from 'underscore';
import React from 'react';

export default React.createClass({
  handleClick: function (ev) {
    if (this.props.redirect) return;
    ev.preventDefault();
    if (this.props.onClick) this.props.onClick(this.props.album);
  },

  coverPhotos: function () {
    var src = this.props.album.get('cover_photo');
    return _.times(4, function (n) {
      return <div className='cover-photo' key={n}><img src={src} /></div>;
    }, this);
  },

  render: function () {
    var album = this.props.album;
    return (
      <div className='albums-list-item' onClick={this.handleClick}>
        <a href={album.get('links').web}>
          <div className='cover-photos-container'>{this.coverPhotos()}</div>
          <div className='name'>{album.get('name')}</div>
          <div className='photo-count'>{album.get('photo_count')} Photos</div>
        </a>
      </div>
    );
  }
});

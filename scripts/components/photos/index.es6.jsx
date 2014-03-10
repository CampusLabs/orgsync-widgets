/** @jsx React.DOM */

import List from 'components/list';
import PhotosListItem from 'components/photos/list-item';
import PhotosShow from 'components/photos/show';
import React from 'react';
import Olay from 'components/olay';

var keyDirMap = {'37': -1, '39': 1};

export default React.createClass({
  componentWillMount: function () {
    document.addEventListener('keydown', this.onKeyDown);
  },

  componentWillUnmount: function () {
    document.removeEventListener('keydown', this.onKeyDown);
  },

  onKeyDown: function (ev) {
    if (this.olay && this.olay.hasFocus()) this.incrPhoto(keyDirMap[ev.which]);
  },

  incrPhoto: function (dir) {
    if (!dir) return;
    var photos = this.props.photos;
    var l = photos.length;
    var photo = this.currentPhoto;
    this.openPhoto(photos.at((l + photos.indexOf(photo) + dir) % l));
  },

  openPhoto: function (photo) {
    if (!this.olay) {
      this.olay = Olay.create({
        className: 'photos-show',
        options: {preserve: true}
      });
    }
    this.olay.setProps({
      children:
        <PhotosShow
          key={photo.id}
          photo={photo}
          onImageClick={this.incrPhoto.bind(this, 1)}
        />
    });
    this.olay.show();
    this.currentPhoto = photo;
  },

  renderListItem: function (photo) {
    return (
      <PhotosListItem
        key={photo.id}
        photo={photo}
        redirect={this.props.redirect}
        onClick={this.openPhoto}
      />
    );
  },

  render: function () {
    return (
      <List
        className='photos-index'
        collection={this.props.photos}
        renderListItem={this.renderListItem}
        uniform={true}
      />
    );
  }
});

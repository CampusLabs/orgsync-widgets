/** @jsx React.DOM */

import PhotosListItem from 'components/photos/list-item';
import PhotosShow from 'components/photos/show';
import React from 'react';
import Olay from 'olay';

var keyDirMap = {
  '37': 'left',
  '39': 'right'
};

export default React.createClass({
  getInitialState: function () {
    return {isLoading: false, error: null};
  },

  componentWillMount: function () {
    $(document).on('keydown', this.handleKeyDown);
    this.props.photos.on({
      sync: this.handleSuccess,
      error: this.handleError
    }, this);
    if (this.props.photos.length) return;
    this.setState({isLoading: true});
    this.props.photos.fetch();
  },

  componentWillUnmount: function () {
    $(document).off('keydown', this.handleKeyDown);
    this.props.photos.off(null, null, this);
  },

  handleKeyDown: function (ev) {
    if (!this.olayHasFocus()) return;
    var photos = this.props.photos;
    var l = photos.length;
    var photo = this.currentPhoto;
    switch (keyDirMap[ev.which]) {
    case 'left':
      this.openPhoto(photos.at((l + photos.indexOf(photo) - 1) % l));
      break;
    case 'right':
      this.openPhoto(photos.at((l + photos.indexOf(photo) + 1) % l));
      break;
    }
  },

  handleSuccess: function () {
    this.setState({isLoading: false, error: null});
  },

  handleError: function (photos, er) {
    this.setState({isLoading: false, error: er.toString()});
  },

  olayHasFocus: function () {
    if (!this.olay) return false;
    var olays = document.getElementsByClassName('js-olay-container');
    return olays[olays.length - 1] === this.olay.$container[0];
  },

  openPhoto: function (photo) {
    if (this.olay) React.unmountComponentAtNode(this.olay.$el[0]);
    else this.olay = new Olay('<div>', {preserve: true});
    React.renderComponent(<PhotosShow photo={photo} />, this.olay.$el[0]);
    this.olay.show();
    this.currentPhoto = photo;
  },

  listItems: function () {
    return this.props.photos.map(function (photo) {
      return (
        <PhotosListItem key={photo.id} photo={photo} onClick={this.openPhoto}
        />
      );
    }, this);
  },

  render: function () {
    if (this.state.isLoading) return <div>Loading...</div>;
    if (this.state.error) return <div>{this.state.error}</div>;
    return <div>{this.listItems()}</div>;
  }
});

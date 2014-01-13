/** @jsx React.DOM */

import BackboneMixin from 'mixins/backbone';
import PhotosListItem from 'components/photos/list-item';
import PhotosShow from 'components/photos/show';
import React from 'react';
import OswOlay from 'osw-olay';

var keyDirMap = {'37': -1, '39': 1};

export default React.createClass({
  mixins: [BackboneMixin],

  getBackboneModels: function () {
    return [this.props.photos];
  },

  getInitialState: function () {
    return {isLoading: false, error: null};
  },

  componentWillMount: function () {
    $(document).on('keydown', this.handleKeyDown);
    if (!this.props.photos.areFetched) this.fetch();
  },

  fetch: function () {
    this.props.photos.areFetched = true;
    this.setState({isLoading: true, error: null});
    this.props.photos.pagedFetch({
      success: this.handleSuccess,
      error: this.handleError
    });
  },

  componentWillUnmount: function () {
    $(document).off('keydown', this.handleKeyDown);
  },

  handleKeyDown: function (ev) {
    if (this.olayHasFocus()) this.incrPhoto(keyDirMap[ev.which]);
  },

  incrPhoto: function (dir) {
    if (!dir) return;
    var photos = this.props.photos;
    var l = photos.length;
    var photo = this.currentPhoto;
    this.openPhoto(photos.at((l + photos.indexOf(photo) + dir) % l));
  },

  handleSuccess: function () {
    this.setState({isLoading: false, error: null});
  },

  handleError: function (photos, er) {
    this.props.photos.areFetched = false;
    this.setState({isLoading: false, error: er.toString()});
  },

  olayHasFocus: function () {
    if (!this.olay) return false;
    var olays = document.getElementsByClassName('js-olay-container');
    return olays[olays.length - 1] === this.olay.$container[0];
  },

  openPhoto: function (photo) {
    if (this.olay) React.unmountComponentAtNode(this.olay.$el[0]);
    else this.olay = new OswOlay('<div>', {preserve: true}, 'photos-show');
    React.renderComponent(
      <PhotosShow photo={photo} onImageClick={this.incrPhoto.bind(this, 1)} />,
      this.olay.$el[0]
    );
    this.olay.show();
    this.currentPhoto = photo;
  },

  listItems: function () {
    return this.props.photos.map(function (photo) {
      return (
        <PhotosListItem
          key={photo.id}
          photo={photo}
          redirect={this.props.redirect}
          onClick={this.openPhoto}
        />
      );
    }, this);
  },

  render: function () {
    return (
      <div className='photos-index'>
        {this.listItems()}
        {this.state.isLoading ? 'Loading...' : null}
        {this.state.error ? this.state.error : null}
      </div>
    );
  }
});

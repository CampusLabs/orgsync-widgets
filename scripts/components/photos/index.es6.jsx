/** @jsx React.DOM */

import BackboneMixin from 'mixins/backbone';
import PhotosListItem from 'components/photos/list-item';
import PhotosShow from 'components/photos/show';
import React from 'react';
import OswOlay from 'osw-olay';

var keyDirMap = {
  '37': 'left',
  '39': 'right'
};

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
    if (this.props.photos.areFetched) return;
    this.props.photos.areFetched = true;
    this.setState({isLoading: true, error: null});
    this.props.photos.pagedFetch({
      success: this.handleSuccess,
      error: this.handleError
    });
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
    else this.olay = new OswOlay('<div>', {preserve: true}, 'photos-show');
    React.renderComponent(<PhotosShow photo={photo} />, this.olay.$el[0]);
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

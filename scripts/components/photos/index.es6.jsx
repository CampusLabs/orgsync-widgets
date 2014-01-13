/** @jsx React.DOM */

module Album from 'entities/album';
import BackboneMixin from 'mixins/backbone';
import ExpectedPropsMixin from 'mixins/expected-props';
import LoadingSpinner from 'components/loading-spinner';
module Photo from 'entities/photo';
import PhotosListItem from 'components/photos/list-item';
import PhotosShow from 'components/photos/show';
import React from 'react';
import OswOlay from 'osw-olay';

var keyDirMap = {'37': -1, '39': 1};

export default React.createClass({
  mixins: [ExpectedPropsMixin, BackboneMixin],

  getExpectedProps: function () {
    return {
      photos: {
        type: Photo.Collection,
        alternates: {
          albumId: (new Album.Model({id: this.props.albumId})).get('photos')
        }
      }
    };
  },

  getBackboneModels: function () {
    return [this.props.photos];
  },

  componentWillMount: function () {
    document.addEventListener('keydown', this.onKeyDown);
    if (!this.props.photos.areFetched) this.props.photos.pagedFetch();
  },

  componentWillUnmount: function () {
    document.removeEventListener('keydown', this.onKeyDown);
  },

  onKeyDown: function (ev) {
    if (this.olayHasFocus()) this.incrPhoto(keyDirMap[ev.which]);
  },

  incrPhoto: function (dir) {
    if (!dir) return;
    var photos = this.props.photos;
    var l = photos.length;
    var photo = this.currentPhoto;
    this.openPhoto(photos.at((l + photos.indexOf(photo) + dir) % l));
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
        {this.state.loadCount ? <LoadingSpinner /> : null}
        {this.state.error ? this.state.error : null}
      </div>
    );
  }
});

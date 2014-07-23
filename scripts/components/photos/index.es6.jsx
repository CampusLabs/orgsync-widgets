/** @jsx React.DOM */

import $ from 'jquery';
import _ from 'underscore';
import api from 'api';
import ListItem from 'components/photos/list-item';
import Show from 'components/photos/show';
import Cursors from 'cursors';
import List from 'react-list';
import React from 'react';
import Popup from 'components/popup';

var keyDirMap = {'37': -1, '39': 1};

var PER_PAGE = 100;

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      photos: [],
      activePhotoId: null
    };
  },

  componentWillMount: function () {
    $(document).on('keydown', this.handleKeyDown);
  },

  componentWillUnmount: function () {
    $(document).off('keydown', this.handleKeyDown);
  },

  getActivePhoto: function () {
    return _.find(this.state.photos, _.matches({id: this.state.activePhotoId}));
  },

  handleKeyDown: function (ev) {
    this.incrActivePhoto(keyDirMap[ev.which]);
  },

  closeActivePhoto: function () {
    this.update({activePhotoId: {$set: null}});
  },

  incrActivePhoto: function (dir) {
    if (!dir || !this.state.activePhotoId) return;
    var photos = this.state.photos;
    var l = photos.length;
    var photo = this.getActivePhoto();
    this.update({activePhotoId: {
      $set: photos[(l + photos.indexOf(photo) + dir) % l].id
    }});
  },

  fetch: function (cb) {
    api.get('/portals/:portal_id/albums/:album_id/photos', {
      portal_id: this.props.portalId,
      album_id: this.props.albumId,
      page: Math.floor(this.state.photos.length / PER_PAGE) + 1,
      per_page: PER_PAGE
    }, _.partial(this.handleFetch, cb));
  },

  handleFetch: function (cb, er, res) {
    if (!this.isMounted()) return;
    if (er) return cb(er);
    var photos = _.chain(this.state.photos.concat(res.data))
      .unique(_.property('id'))
      .map(function (photo) { return _.extend({comments: []}, photo); })
      .value();
    this.update({photos: {$set: photos}});
    cb(null, res.data.length < PER_PAGE);
  },

  handleImageClick: function () {
    this.incrActivePhoto(1);
  },

  renderListItem: function (photo) {
    return (
      <ListItem
        key={photo.id}
        photo={photo}
        redirect={this.props.redirect}
        cursors={{activePhotoId: this.getCursor('activePhotoId')}}
      />
    );
  },

  renderActivePhoto: function () {
    var photo = this.getActivePhoto();
    if (!photo) return;
    return (
      <Show
        key={photo.id}
        onImageClick={this.handleImageClick}
        cursors={{
          photo: this.getCursor('photos', this.state.photos.indexOf(photo))
        }}
      />
    );
  },

  render: function () {
    return (
      <div className='osw-photos-index'>
        <List
          className='osw-photos-index-list'
          items={this.state.photos}
          renderItem={this.renderListItem}
          fetch={this.fetch}
        />
        <Popup
          name='photos-show'
          close={this.closeActivePhoto}
          title='Photo Details'
        >
          {this.renderActivePhoto()}
        </Popup>
      </div>
    );
  }
});

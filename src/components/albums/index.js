import $ from 'jquery';
import _ from 'underscore';
import api from 'api';
import ListItem from 'components/albums/list-item';
import Show from 'components/albums/show';
import {Mixin as Cursors} from 'cursors';
import FetchList from 'components/ui/fetch-list';
import React from 'react';
import Popup from 'components/ui/popup';

const keyDirMap = {37: -1, 39: 1};

const PER_PAGE = 100;

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      albums: [],
      activeAlbumId: null,
      activePhotoId: null
    };
  },

  componentWillMount: function () {
    $(document).on('keydown', this.handleKeyDown);
  },

  componentWillUnmount: function () {
    $(document).off('keydown', this.handleKeyDown);
  },

  getActiveAlbum: function () {
    return _.find(this.state.albums, _.matches({id: this.state.activeAlbumId}));
  },

  handleKeyDown: function (ev) {
    this.incrActiveAlbum(keyDirMap[ev.which]);
  },

  closeActiveAlbum: function () {
    this.update({activeAlbumId: {$set: null}});
  },

  incrActiveAlbum: function (dir) {
    if (!dir || !this.state.activeAlbumId || this.state.activePhotoId) return;
    var albums = this.state.albums;
    var l = albums.length;
    var album = this.getActiveAlbum();
    this.update({activeAlbumId: {
      $set: albums[(l + albums.indexOf(album) + dir) % l].id
    }});
  },

  fetch: function (cb) {
    api.get('/portals/:portal_id/albums', {
      portal_id: this.props.portalId,
      page: Math.floor(this.state.albums.length / PER_PAGE) + 1,
      per_page: PER_PAGE
    }, _.partial(this.handleFetch, cb));
  },

  handleFetch: function (cb, er, res) {
    if (er) return cb(er);
    var albums = _.chain(this.state.albums.concat(res.data))
      .unique(_.property('id'))
      .map(function (album) { return _.extend({photos: []}, album); })
      .value();
    this.update({albums: {$push: albums}});
    cb(null, res.data.length < PER_PAGE);
  },

  renderListItem: function (album) {
    return (
      <ListItem
        key={album.id}
        album={album}
        redirect={this.props.redirect}
        cursors={{activeAlbumId: this.getCursor('activeAlbumId')}}
      />
    );
  },

  renderActiveAlbum: function () {
    var album = this.getActiveAlbum();
    if (!album) return;
    return (
      <Popup
        name='albums-show'
        close={this.closeActiveAlbum}
        title='Album Details'
      >
        <Show
          key={album.id}
          portalId={this.props.portalId}
          cursors={{
            album: this.getCursor('albums', this.state.albums.indexOf(album)),
            activePhotoId: this.getCursor('activePhotoId')
          }}
        />
      </Popup>
    );
  },

  render: function () {
    return (
      <div className='osw-albums-index'>
        <FetchList
          className='osw-albums-index-list'
          fetch={this.fetch}
          itemRenderer={this.renderListItem}
          items={this.state.albums}
        />
        {this.renderActiveAlbum()}
      </div>
    );
  }
});

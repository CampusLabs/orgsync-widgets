/** @jsx React.DOM */

import $ from 'jquery';
import Album from 'entities/portal';
import AlbumsListItem from 'components/albums/list-item';
import AlbumsShow from 'components/albums/show';
import CoercedPropsMixin from 'mixins/coerced-props';
import List from 'components/list';
import Portal from 'entities/portal';
import React from 'react';
import Olay from 'components/olay';

var keyDirMap = {'37': -1, '39': 1};

export default React.createClass({
  mixins: [CoercedPropsMixin],

  getCoercedProps: function () {
    return {
      albums: {
        type: Album.Collection,
        alternates: {
          portalId: (new Portal.Model({id: this.props.portalId})).get('albums')
        }
      }
    };
  },

  componentWillMount: function () {
    $(document).on('keydown', this.onKeyDown);
  },

  componentWillUnmount: function () {
    $(document).off('keydown', this.onKeyDown);
  },

  onKeyDown: function (ev) {
    if (this.olay && this.olay.hasFocus()) this.incrAlbum(keyDirMap[ev.which]);
  },

  incrAlbum: function (dir) {
    if (!dir) return;
    var albums = this.props.albums;
    var l = albums.length;
    var album = this.currentAlbum;
    this.openAlbum(albums.at((l + albums.indexOf(album) + dir) % l));
  },

  openAlbum: function (album) {
    if (!this.olay) {
      this.olay = Olay.create({
        olayClassName: 'albums-show',
        olayOptions: {preserve: true},
        component: AlbumsShow,
        key: album.get('id'),
        album: album
      });
    } else {
      this.olay.setProps({key: album.get('id'), album: album});
    }
    this.olay.show();
    this.currentAlbum = album;
  },

  renderListItem: function (album) {
    return (
      <AlbumsListItem
        key={album.id}
        album={album}
        redirect={this.props.redirect}
        onClick={this.openAlbum}
      />
    );
  },

  render: function () {
    return (
      <List
        className='osw-albums-index'
        collection={this.props.albums}
        renderListItem={this.renderListItem}
        renderPageSize={5}
      />
    );
  }
});

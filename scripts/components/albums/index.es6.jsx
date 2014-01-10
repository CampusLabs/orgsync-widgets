/** @jsx React.DOM */

import AlbumsListItem from 'components/albums/list-item';
import AlbumsShow from 'components/albums/show';
import BackboneMixin from 'mixins/backbone';
module Portal from 'entities/portal';
import React from 'react';
import OswOlay from 'osw-olay';

var keyDirMap = {
  '37': 'left',
  '39': 'right'
};

export default React.createClass({
  mixins: [BackboneMixin],

  getBackboneModels: function () {
    return [this.props.albums];
  },

  getInitialState: function () {
    return {isLoading: false, error: null};
  },

  componentWillMount: function () {
    if (!this.props.albums) {
      if (this.props.portalId) {
        this.props.albums =
          (new Portal.Model({id: this.props.portalId})).get('albums');
      }
    }
    $(document).on('keydown', this.handleKeyDown);
    if (this.props.albums.fetched) return;
    this.props.albums.fetched = true;
    this.props.albums.pagedFetch();
  },

  componentWillUnmount: function () {
    $(document).off('keydown', this.handleKeyDown);
  },

  olayHasFocus: function () {
    if (!this.olay) return false;
    var olays = document.getElementsByClassName('js-olay-container');
    return olays[olays.length - 1] === this.olay.$container[0];
  },

  handleKeyDown: function (ev) {
    if (!this.olayHasFocus()) return;
    var albums = this.props.albums;
    var l = albums.length;
    var album = this.currentAlbum;
    switch (keyDirMap[ev.which]) {
    case 'left':
      this.openAlbum(albums.at((l + albums.indexOf(album) - 1) % l));
      break;
    case 'right':
      this.openAlbum(albums.at((l + albums.indexOf(album) + 1) % l));
      break;
    }
  },

  openAlbum: function (album) {
    if (this.olay) React.unmountComponentAtNode(this.olay.$el[0]);
    else this.olay = new OswOlay('<div>', {preserve: true}, 'albums-show');
    React.renderComponent(<AlbumsShow album={album} />, this.olay.$el[0]);
    this.olay.show();
    this.currentAlbum = album;
  },

  listItems: function () {
    return this.props.albums.map(function (album) {
      return (
        <AlbumsListItem
          key={album.id}
          album={album}
          redirect={this.props.redirect}
          onClick={this.openAlbum}
        />
      );
    }, this);
  },

  render: function () {
    return <div className='albums-index'>{this.listItems()}</div>;
  }
});

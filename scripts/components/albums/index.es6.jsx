/** @jsx React.DOM */

import AlbumsListItem from 'components/albums/list-item';
import AlbumsShow from 'components/albums/show';
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
    this.props.albums.on({
      sync: this.handleSuccess,
      error: this.handleError
    }, this);
    if (this.props.albums.length) return;
    this.setState({isLoading: true});
    this.props.albums.fetch();
  },

  componentWillUnmount: function () {
    $(document).off('keydown', this.handleKeyDown);
    this.props.albums.off(null, null, this);
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

  handleSuccess: function () {
    this.setState({isLoading: false, error: null});
  },

  handleError: function (albums, er) {
    this.setState({isLoading: false, error: er.toString()});
  },

  openAlbum: function (album) {
    if (this.olay) React.unmountComponentAtNode(this.olay.$el[0]);
    else this.olay = new Olay('<div>', {preserve: true});
    React.renderComponent(<AlbumsShow album={album} />, this.olay.$el[0]);
    this.olay.show();
    this.currentAlbum = album;
  },

  listItems: function () {
    return this.props.albums.map(function (album) {
      return (
        <AlbumsListItem key={album.id} album={album} onClick={this.openAlbum} />
      );
    }, this);
  },

  render: function () {
    if (this.state.isLoading) return <div>Loading...</div>;
    if (this.state.error) return <div>{this.state.error}</div>;
    return <div>{this.listItems()}</div>;
  }
});

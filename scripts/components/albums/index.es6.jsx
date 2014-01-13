/** @jsx React.DOM */

module Album from 'entities/portal';
import AlbumsListItem from 'components/albums/list-item';
import AlbumsShow from 'components/albums/show';
import BackboneMixin from 'mixins/backbone';
import ExpectedPropsMixin from 'mixins/expected-props';
import LoadingSpinner from 'components/loading-spinner';
module Portal from 'entities/portal';
import React from 'react';
import OswOlay from 'osw-olay';

var keyDirMap = {'37': -1, '39': 1};

export default React.createClass({
  mixins: [ExpectedPropsMixin, BackboneMixin],

  getExpectedProps: function () {
    return {
      albums: {
        type: Album.Collection,
        alternates: {
          portalId: (new Portal.Model({id: this.props.portalId})).get('albums')
        }
      }
    };
  },

  getBackboneModels: function () {
    return [this.props.albums];
  },

  componentWillMount: function () {
    document.addEventListener('keydown', this.onKeyDown);
    if (!this.props.albums.areFetched) this.props.albums.pagedFetch();
  },

  componentWillUnmount: function () {
    document.removeEventListener('keydown', this.onKeyDown);
  },

  olayHasFocus: function () {
    if (!this.olay) return false;
    var olays = document.getElementsByClassName('js-olay-container');
    return olays[olays.length - 1] === this.olay.$container[0];
  },

  onKeyDown: function (ev) {
    if (this.olayHasFocus()) this.incrAlbum(keyDirMap[ev.which]);
  },

  incrAlbum: function (dir) {
    if (!dir) return;
    var albums = this.props.albums;
    var l = albums.length;
    var album = this.currentAlbum;
    this.openAlbum(albums.at((l + albums.indexOf(album) + dir) % l));
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
    return (
      <div className='albums-index'>
        {this.listItems()}
        {this.state.loadCount ? <LoadingSpinner /> : null}
        {this.state.error ? this.state.error : null}
      </div>
    );
  }
});

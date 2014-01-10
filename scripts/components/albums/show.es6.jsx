/** @jsx React.DOM */

import $ from 'jquery';
import PhotosIndex from 'components/photos/index';
import React from 'react';

var keyDirMap = {
  '37': 'left',
  '39': 'right'
};

export default React.createClass({
  componentWillMount: function () {
    $(document).on('keydown', this.handleKeyDown);
  },

  componentWillUnmount: function () {
    $(document).off('keydown', this.handleKeyDown);
  },

  handleKeyDown: function (ev) {
    switch (keyDirMap[ev.which]) {
    case 'left':
    case 'right':
    }
  },

  render: function () {
    return (
      <div className='albums-show'>
        <div className='album-title'>
          {this.props.album.get('name')}
        </div>
        <div className='album-photos'>
          <PhotosIndex photos={this.props.album.get('photos')} />
        </div>
      </div>
    );
  }
});

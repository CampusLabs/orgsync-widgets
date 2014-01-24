/** @jsx React.DOM */

import Icon from 'components/icon';
import React from 'react';

export default React.createClass({
  onClick: function (ev) {
    if (this.props.redirect) return;
    ev.preventDefault();
    if (this.props.onClick) this.props.onClick(this.props.photo);
  },

  render: function () {
    var photo = this.props.photo;
    var count = photo.get('comments_count');
    return (
      <div className='photos-list-item' onClick={this.onClick}>
        <a href={photo.get('links').web}>
          <div className='thumbnail'>
            <img src={photo.get('thumbnail_url')} />
          </div>
          <div className={'comment-count' + (count ? '' : ' none')}>
            {count}<Icon name='communication' />
          </div>
        </a>
      </div>
    );
  }
});
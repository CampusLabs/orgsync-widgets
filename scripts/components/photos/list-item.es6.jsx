/** @jsx React.DOM */

import Icon from 'components/icon';
import React from 'react';

export default React.createClass({
  handleClick: function (ev) {
    if (this.props.redirect) return;
    ev.preventDefault();
    if (this.props.onClick) this.props.onClick(this.props.photo);
  },

  render: function () {
    var photo = this.props.photo;
    var count = photo.get('comments_count');
    return (
      <div className='osw-photos-list-item' onClick={this.handleClick}>
        <a href={photo.get('links').web}>
          <div className='osw-thumbnail'>
            <img src={photo.get('thumbnail_url')} />
          </div>
          <div className={'osw-comment-count' + (count ? '' : ' osw-none')}>
            {count}<Icon name='communication' />
          </div>
        </a>
      </div>
    );
  }
});

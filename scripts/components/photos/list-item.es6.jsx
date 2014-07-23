/** @jsx React.DOM */

import Cursors from 'cursors';
import Icon from 'components/icon';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  handleClick: function (ev) {
    if (this.props.redirect) return;
    ev.preventDefault();
    this.update({activePhotoId: {$set: this.props.photo.id}});
  },

  renderCommentCount: function () {
    var count = this.props.photo.comments_count;
    if (!count) return;
    return (
      <div className='osw-photos-list-item-comment-count'>
        {count} <Icon name='communication' />
      </div>
    );
  },

  render: function () {
    var photo = this.props.photo;
    return (
      <a
        className='osw-photos-list-item'
        onClick={this.handleClick}
        href={photo.links.web}
      >
        <div className='osw-photos-list-item-thumbnail'>
          <img src={photo.thumbnail_url} />
        </div>
        {this.renderCommentCount()}
      </a>
    );
  }
});

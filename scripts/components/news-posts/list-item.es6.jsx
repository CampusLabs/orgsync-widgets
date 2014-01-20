/** @jsx React.DOM */

import Icon from 'components/icon';
import React from 'react';

export default React.createClass({
  getDefaultProps: function () {
    return {
      truncateLength: 0
    };
  },

  onTitleClick: function (ev) {
    if (this.props.redirect) return;
    ev.preventDefault();
    if (this.props.onTitleClick) this.props.onTitleClick(this.props.newsPost);
  },

  render: function () {
    var newsPost = this.props.newsPost;
    var count = newsPost.get('comments_count');
    return (
      <div className='news-posts-list-item'>
        <div className='thumbnail'>
          <img src={newsPost.get('thumbnail_url')} />
        </div>
        <a
          href={newsPost.get('links').web}
          className='title'
          onClick={this.onTitleClick}>
          {newsPost.get('title')}
        </a>
        <div className='creator'>
          {newsPost.get('creator').get('display_name')}
        </div>
        <div className='time'>{newsPost.time()}</div>
        <div className={'comment-count' + (count ? '' : ' none')}>
          {count}<Icon name='communication' />
        </div>
        <div className='body'>
          {newsPost.truncatedBody(this.props.truncateLength)}
        </div>
      </div>
    );
  }
});

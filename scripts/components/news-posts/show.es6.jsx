/** @jsx React.DOM */

import CommentsIndex from 'components/comments/index';
import React from 'react';

export default React.createClass({
  render: function () {
    var newsPost = this.props.newsPost;
    return (
      <div className='news-posts-show'>
        <div className='title'>{newsPost.get('title')}</div>
        <div className='creator'>
          {newsPost.get('creator').get('display_name')}
        </div>
        <div className='time'>{newsPost.time()}</div>
        <div
          className='body'
          dangerouslySetInnerHTML={{__html: newsPost.get('body')}}
        />
        <div className='comments-header'>Comments</div>
        <CommentsIndex comments={newsPost.get('comments')} />
      </div>
    );
  }
});

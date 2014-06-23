/** @jsx React.DOM */

import CommentsIndex from 'components/comments/index';
import React from 'react';

export default React.createClass({
  render: function () {
    var newsPost = this.props.newsPost;
    return (
      <div className='osw-news-posts-show'>
        <div className='osw-title'>{newsPost.get('title')}</div>
        <div className='osw-creator'>
          {newsPost.get('creator').get('display_name')}
        </div>
        <div className='osw-time'>{newsPost.time()}</div>
        <div
          className='osw-body'
          dangerouslySetInnerHTML={{__html: newsPost.get('body')}}
        />
        <div className='osw-comments-header'>Comments</div>
        <CommentsIndex comments={newsPost.get('comments')} />
      </div>
    );
  }
});

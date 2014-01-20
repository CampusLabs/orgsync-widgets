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
        ></div>
        <div className='comments-header'>Comments</div>
        <CommentsIndex comments={newsPost.get('comments')} />
      </div>
    );
  }
});

// <% var thumbnailUrl = o.model.get('thumbnail_url'); %>
// <% if (thumbnailUrl) { %>
// <img src='<%- thumbnailUrl %>' class='thumbnail'>
// <% } %>
// <div class='title'><%- o.model.get('title') %></div>
// <div class='creator'><%- o.model.get('creator').get('display_name') %></div>
// <div class='time'><%- o.model.time() %></div>
// <div class='body'><%= o.model.get('body') %></div>
// <ol class='js-comments comments'></ol>
// <a href='<%- o.model.orgsyncUrl() %>' class='comment-on-orgsync'>
//   Comment on OrgSync
// </a>

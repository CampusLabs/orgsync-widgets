import $ from 'jquery';
import _str from 'underscore.string';
import Cursors from 'cursors';
import Icon from 'components/icon';
import moment from 'moment';
import Show from 'components/news-posts/show';
import Popup from 'components/popup';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      truncateLength: 200
    };
  },

  getInitialState: function () {
    return {
      isOpen: false
    };
  },

  onTitleClick: function (ev) {
    if (this.props.redirect) return;
    ev.preventDefault();
    this.open();
  },

  open: function () {
    this.update({isOpen: {$set: true}});
  },

  close: function () {
    this.update({isOpen: {$set: false}});
  },

  getStrippedBody: function () {
    return $($.parseHTML(this.state.newsPost.body)).text();
  },

  renderCount: function () {
    var count = this.state.newsPost.comments_count;
    if (!count) return;
    return (
      <div className={'osw-news-posts-list-item-comment-count'}>
        {count} <Icon name='communication' />
      </div>
    );
  },

  renderShow: function () {
    if (!this.state.isOpen) return;
    return (
      <Show
        cursors={{newsPost: this.getCursor('newsPost')}}
      />
    );
  },

  render: function () {
    var newsPost = this.state.newsPost;
    return (
      <div className='osw-news-posts-list-item'>
        <div className='osw-news-posts-list-item-thumbnail'>
          <img src={newsPost.thumbnail_url} />
        </div>
        <a
          href={newsPost.links.web}
          className='osw-news-posts-list-item-title'
          onClick={this.onTitleClick}>
          {newsPost.title}
        </a>
        <div className='osw-news-posts-list-item-creator'>
          {newsPost.creator.display_name}
        </div>
        <div className='osw-news-posts-list-item-time'>
          {moment(newsPost.created_at).fromNow()}
        </div>
        {this.renderCount()}
        <div className='osw-news-posts-list-item-body'>
          {_str.prune(this.getStrippedBody(), this.props.truncateLength)}
        </div>
        <Popup
          name='news-posts-show'
          close={this.close}
          title='News Post Details'
        >
          {this.renderShow()}
        </Popup>
      </div>
    );
  }
});

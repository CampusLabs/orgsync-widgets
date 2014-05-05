/** @jsx React.DOM */

module NewsPost from 'entities/news-post';
import NewsPostsListItem from 'components/news-posts/list-item';
import NewsPostsShow from 'components/news-posts/show';
import CoercedPropsMixin from 'mixins/coerced-props';
import List from 'components/list';
module Portal from 'entities/portal';
import React from 'react';
import Olay from 'components/olay';

export default React.createClass({
  mixins: [CoercedPropsMixin],

  getCoercedProps: function () {
    return {
      newsPosts: {
        type: NewsPost.Collection,
        alternates: {
          portalId:
            (new Portal.Model({id: this.props.portalId})).get('newsPosts')
        }
      }
    };
  },

  openNewsPost: function (newsPost) {
    Olay.create({
      className: 'news-posts-show'
    }, <NewsPostsShow newsPost={newsPost} />).show();
  },

  renderListItem: function (newsPost) {
    return (
      <NewsPostsListItem
        key={newsPost.id}
        newsPost={newsPost}
        truncateLength={this.props.truncateLength}
        onTitleClick={this.openNewsPost}
      />
    );
  },

  render: function () {
    return (
      <List
        className='osw-news-posts-index'
        collection={this.props.newsPosts}
        renderListItem={this.renderListItem}
        fetchData={{strip_html: false}}
      />
    );
  }
});

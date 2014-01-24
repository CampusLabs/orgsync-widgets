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
    var component = <NewsPostsShow newsPost={newsPost} />;
    (<Olay className='news-posts-show' component={component} />).show();
  },

  renderListItem: function (newsPost) {
    return (
      <NewsPostsListItem
        key={newsPost.id}
        newsPost={newsPost}
        onTitleClick={this.openNewsPost}
      />
    );
  },

  render: function () {
    return (
      <List
        className='news-posts-index'
        collection={this.props.newsPosts}
        renderListItem={this.renderListItem}
        fetchOptions={{strip_html: false}}
      />
    );
  }
});

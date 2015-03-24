import _ from 'underscore';
import _str from 'underscore.string';
import api from 'api';
import Cursors from 'cursors';
import Empty from 'components/shared/empty';
import Filters from 'components/bookmarks/filters';
import BookmarksListItem from 'components/bookmarks/list-item';
import List from 'react-list';
import React from 'react';

var PER_PAGE = 10;

export default React.createClass({
  mixins: [Cursors],

  propTypes: {
    /* Specify which portal's bookmarks to retrieve */
    portalId: React.PropTypes.number,

    /* If you'd like to limit the number of bookmarks to show, specify a number */
    limit: React.PropTypes.number
  },

  getDefaultProps: function () {
    return {
      bookmarks: [],
      filtersAreShowing: true,
      query: '',
      searchableAttributes: ['name'],
      limit: null
    };
  },

  getInitialState: function () {
    return {
      bookmarks: this.props.bookmarks,
      query: this.props.query
    };
  },

  fetch: function (cb) {
    api.get('/portals/:portal_id/links', {
      portal_id: this.props.portalId,
      limit: this.props.limit,
      page: Math.floor(this.state.bookmarks.length / PER_PAGE) + 1,
      per_page: PER_PAGE
    }, _.partial(this.handleFetch, cb));
  },

  handleFetch: function (cb, er, res) {
    if (er) return cb(er);
    this.update({
      bookmarks: {$set: _.unique(this.state.bookmarks.concat(res.data), 'id')}
    });
    cb(null, res.data.length < PER_PAGE);
  },

  matchesQuery: function(bookmark) {
    var query = this.state.query;
    if (!query) return true;
    var words = _str.words(query.toLowerCase());
    var searchableWords = this.searchableWordsFor(bookmark);
    return _.every(words, function (wordA) {
      return _.any(searchableWords, function (wordB) {
        return _str.startsWith(wordB, wordA);
      });
    });
  },

  searchableWordsFor: function (bookmark) {
    return _str.words(
      _.values(_.pick(bookmark, this.props.searchableAttributes))
        .join(' ')
        .toLowerCase()
    );
  },

  bookmarkMatchesFilters: function(bookmark) {
    return this.matchesQuery(bookmark);
  },

  getFilteredBookmarks: function() {
    return this.state.bookmarks.filter(this.bookmarkMatchesFilters);
  },

  renderFilters: function (bookmarks) {
    if (!this.state.bookmarks.length || !this.props.filtersAreShowing ||
      this.props.limit) return;
    return (
      <Filters
        bookmarks={bookmarks}
        getFacet={this.getFacet}
        cursors={{
          query: this.getCursor('query')
        }}
      />
    );
  },

  renderListItem: function (bookmark) {
    var i = this.state.bookmarks.indexOf(bookmark);
    return (
      <BookmarksListItem
        {...this.props}
        key={bookmark.id}
        cursors={{bookmark: this.getCursor('bookmarks', i)}}
      />
    );
  },

  renderLoading: function () {
    return <div className='osw-inset-block'>Loading...</div>;
  },

  renderError: function (er) {
    return (
      <div className='osw-inset-block osw-inset-block-red'>{er.toString()}</div>
    );
  },

  renderEmpty: function () {
    return (
      <Empty
        objectName='bookmarks'
        cursors={{
          query: this.getCursor('query')
        }}
      />
    );
  },

  render: function () {
    var bookmarks = this.getFilteredBookmarks();
    return (
      <div className='osw-bookmarks-index'>
        {this.renderFilters(bookmarks)}
        <List
          {...this.props}
          items={bookmarks}
          fetch={this.fetch}
          renderLoading={this.renderLoading}
          renderError={this.renderError}
          renderItem={this.renderListItem}
          renderEmpty={this.renderEmpty}
          uniform={true}
        />
      </div>
    );
  }
});
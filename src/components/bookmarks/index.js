import _ from 'underscore';
import _str from 'underscore.string';
import api from 'api';
import BookmarksListItem from 'components/bookmarks/list-item';
import {Mixin as Cursors} from 'cursors';
import Empty from 'components/shared/empty';
import ErrorBlock from 'components/ui/error-block';
import Filters from 'components/bookmarks/filters';
import FetchList from 'components/ui/fetch-list';
import LoadingBlock from 'components/ui/loading-block';
import React from 'react';

var PER_PAGE = 10;

export default React.createClass({
  mixins: [Cursors],

  propTypes: {
    /* Specify which portal's bookmarks to retrieve */
    portalId: React.PropTypes.number.isRequired,
  },

  getDefaultProps() {
    return {
      bookmarks: [],
      filtersAreShowing: true,
      query: '',
      searchableAttributes: ['name']
    };
  },

  getInitialState() {
    return {
      bookmarks: this.props.bookmarks,
      query: this.props.query
    };
  },

  fetch(cb) {
    api.get('/portals/:portal_id/links', {
      portal_id: this.props.portalId,
      page: Math.floor(this.state.bookmarks.length / PER_PAGE) + 1,
      per_page: PER_PAGE
    }, _.partial(this.handleFetch, cb));
  },

  handleFetch(cb, er, res) {
    if (er) return cb(er);
    this.update({
      bookmarks: {$set: _.unique(this.state.bookmarks.concat(res.data), 'id')}
    });
    cb(null, res.data.length < PER_PAGE);
  },

  matchesQuery(bookmark) {
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

  searchableWordsFor(bookmark) {
    return _str.words(
      _.values(_.pick(bookmark, this.props.searchableAttributes))
        .join(' ')
        .toLowerCase()
    );
  },

  bookmarkMatchesFilters(bookmark) {
    return this.matchesQuery(bookmark);
  },

  getFilteredBookmarks() {
    return this.state.bookmarks.filter(this.bookmarkMatchesFilters);
  },

  renderFilters(bookmarks) {
    if (!this.state.bookmarks.length || !this.props.filtersAreShowing) return;
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

  renderListItem(bookmark) {
    var i = this.state.bookmarks.indexOf(bookmark);
    return (
      <BookmarksListItem
        {...this.props}
        key={bookmark.id}
        cursors={{bookmark: this.getCursor('bookmarks', i)}}
      />
    );
  },

  renderLoading() {
    return <LoadingBlock />;
  },

  renderError(er) {
    return <ErrorBlock message={er.toString()} />;
  },

  renderEmpty() {
    return (
      <Empty
        objectName='bookmarks'
        cursors={{
          query: this.getCursor('query')
        }}
      />
    );
  },

  render() {
    var bookmarks = this.getFilteredBookmarks();
    return (
      <div className='osw-bookmarks-index'>
        {this.renderFilters(bookmarks)}
        <FetchList
          {...this.props}
          emptyRenderer={this.renderEmpty}
          errorRenderer={this.renderError}
          fetch={this.fetch}
          itemRenderer={this.renderListItem}
          items={bookmarks}
          loadingRenderer={this.renderLoading}
          type='uniform'
        />
      </div>
    );
  }
});

import _ from 'underscore';
import _str from 'underscore.string';
import api from 'api';
import Cursors from 'cursors';
import Empty from 'components/shared/empty';
import ErrorBlock from 'components/ui/error-block';
import Filters from 'components/polls/filters';
import List from 'react-list';
import LoadingBlock from 'components/ui/loading-block';
import PollsListItem from 'components/polls/list-item';
import React from 'react';

var PER_PAGE = 10;

export default React.createClass({
  mixins: [Cursors],

  propTypes: {
    /* Specify which portal's polls to retrieve */
    portalId: React.PropTypes.number
  },

  getDefaultProps() {
    return {
      category: '',
      polls: [],
      filtersAreShowing: true,
      query: '',
      searchableAttributes: ['name']
    };
  },

  getInitialState() {
    return {
      category: this.props.category,
      polls: this.props.polls,
      query: this.props.query
    };
  },

  fetch(cb) {
    api.get('/portals/:portal_id/polls', {
      portal_id: this.props.portalId,
      page: Math.floor(this.state.polls.length / PER_PAGE) + 1,
      per_page: PER_PAGE
    }, _.partial(this.handleFetch, cb));
  },

  handleFetch(cb, er, res) {
    if (er) return cb(er);
    this.update({
      polls: {$set: _.unique(this.state.polls.concat(res.data), 'id')}
    });
    cb(null, res.data.length < PER_PAGE);
  },

  getFacet(poll) {
    if (poll.is_open) return 'Open';
    return 'Closed';
  },

  matchesCategory(poll) {
    var a = this.state.category;
    var b = this.getFacet(poll);
    return !a || a === b;
  },

  matchesQuery(poll) {
    var query = this.state.query;
    if (!query) return true;
    var words = _str.words(query.toLowerCase());
    var searchableWords = this.searchableWordsFor(poll);
    return _.every(words, function (wordA) {
      return _.any(searchableWords, function (wordB) {
        return _str.startsWith(wordB, wordA);
      });
    });
  },

  searchableWordsFor(poll) {
    return _str.words(
      _.values(_.pick(poll, this.props.searchableAttributes))
      .join(' ')
      .toLowerCase()
    );
  },

  pollMatchesFilters(poll) {
    return (
      this.matchesQuery(poll) &&
      this.matchesCategory(poll)
    );
  },

  getFilteredPolls() {
    return this.state.polls.filter(this.pollMatchesFilters);
  },

  renderFilters(polls) {
    if (!this.state.polls.length || !this.props.filtersAreShowing) return;
    return (
      <Filters
        polls={polls}
        getFacet={this.getFacet}
        cursors={{
          category: this.getCursor('category'),
          query: this.getCursor('query')
        }}
      />
    );
  },

  renderListItem(poll) {
    var i = this.state.polls.indexOf(poll);
    return (
      <PollsListItem
        {...this.props}
        key={poll.id}
        cursors={{poll: this.getCursor('polls', i)}}
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
        objectName='polls'
        cursors={{
          query: this.getCursor('query'),
          category: this.getCursor('category')
        }}
      />
    );
  },

  render() {
    var polls = this.getFilteredPolls();
    return (
      <div className='osw-polls-index'>
        {this.renderFilters(polls)}
        <List
          {...this.props}
          items={polls}
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

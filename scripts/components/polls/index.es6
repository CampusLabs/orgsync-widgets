import _ from 'underscore';
import _str from 'underscore.string';
import api from 'api';
import Cursors from 'cursors';
import Empty from 'components/shared/empty';
import Filters from 'components/polls/filters';
import PollsListItem from 'components/polls/list-item';
import List from 'react-list';
import React from 'react';

var PER_PAGE = 10;

var staticRes= {
  data: [
    { name: 'What is your favorite color?', id: 1 },
    { name: 'Who should be president?', id: 2 },
    { name: 'What day should the game be played?', id: 3 },
    { name: 'Which food do you prefer?', id: 4 },
    { name: 'When should the parade start?', id: 5 },
    { name: 'Do you agree with the president?', id: 6 }
  ]
};

export default React.createClass({
  mixins: [Cursors],

  propTypes: {
    portalId: React.PropTypes.number
  },

  getDefaultProps: function () {
    return {
      polls: [],
      filtersAreShowing: true,
      query: '',
      searchableAttributes: ['name']
    };
  },

  getInitialState: function () {
    return {
      polls: this.props.polls,
      query: this.props.query
    };
  },

  componentWillMount: function () {
    if (this.state.polls.length) this.sortAndUpdate(this.state.polls);
  },

  fetch: function (cb) {
    this.update({
      polls: {$set: _.unique(this.state.polls.concat(staticRes.data), 'id')}
    });

    cb(null, staticRes.data.length < PER_PAGE);
  },

  matchesQuery: function(poll) {
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

  searchableWordsFor: function (poll) {
    return _str.words(
      _.values(_.pick(poll, this.props.searchableAttributes))
      .join(' ')
      .toLowerCase()
    );
  },

  pollMatchesFilters: function(poll) {
    return this.matchesQuery(poll)
  },

  getFilteredPolls: function() {
    return this.state.polls.filter(this.pollMatchesFilters);
  },

  renderFilters: function (polls) {
    if (!this.state.polls.length || !this.props.filtersAreShowing) return;
    return (
      <Filters
        polls={polls}
        cursors={{
          query: this.getCursor('query'),
        }}
      />
    );
  },

  renderListItem: function (poll) {
    var i = this.state.polls.indexOf(poll);
    return (
      <PollsListItem
        key={poll.id}
        cursors={{poll: this.getCursor('polls', i)}}
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
        objectName='polls'
        cursors={{
          query: this.getCursor('query')
        }}
      />
    );
  },

  render: function () {
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

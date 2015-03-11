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
    {
      name: 'What is your favorite color?',
      id: 1,
      votes: 10,
      links: { web: '#' },
      description: '',
      creator: { display_name: 'John Smith' },
      poll_options: [{ id: 15, name: 'Blue', votes: 3 }, { id: 16, name: 'Green', votes: 4 }, { id: 17, name: 'Red', votes: 3 }]
    },
    {
      name: 'Who should be president?',
      id: 2,
      votes: 0,
      links: { web: '#' },
      description: '',
      creator: { display_name: 'Jane Doe' },
      poll_options: null
    },
    {
      name: 'What day should the game be played?',
      id: 3,
      votes: 13,
      links: { web: '#' },
      description: 'Let us know when the volleyball game should take place.',
      creator: { display_name: 'John Smith' },
      poll_options: [{ id: 9, name: 'Monday', votes: 3 }, { id: 10, name: 'Tuesday', votes: 1 }, { id: 11, name: 'Thursday', votes: 2 }, { id: 12, name: 'Saturday', votes: 7 }]
    },
    {
      name: 'Which food do you prefer?',
      id: 4,
      votes: 14,
      links: { web: '#' },
      description: "Please choose the food which you'd like to have served at this year's BBQ.",
      creator: { display_name: 'Jane Doe' },
      poll_options: [{ id: 8, name: 'Ribs', votes: 3 }, { id: 7, name: 'Steak', votes: 1 }, { id: 6, name: 'Brisket', votes: 10 }]
    },
    {
      name: 'When should the parade start?',
      id: 5,
      votes: 5,
      links: { web: '#' },
      description: '',
      creator: { display_name: 'Jane Doe' },
      poll_options: null
    },
    {
      name: 'Do you agree with the president?',
      id: 6,
      votes: 15,
      links: { web: '#' },
      description: '',
      creator: { display_name: 'John Smith' },
      poll_options: [{ id: 1, name: 'Yes', votes: 8 }, { id: 2, name: 'No', votes: 4 }, { id: 3, name: 'Not Sure', votes: 3 }]
    }
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

/*
  componentWillMount: function () {
    var rId = 100;

    _(100).times(function(n) {
      var votes = _.random(0, 50);
      var totalVotes = votes;
      var poll_options = [];


      var maxTimes = 10;
      while(votes > 0 && maxTimes > 0) {
        var vote = _.random(0, votes);
        votes -= vote;

        poll_options.push({
          id: rId,
          name: _.random(0, 1123),
          votes: vote
        });
        rId += 1;
        maxTimes -= 1;
      }

      if(votes > 0) {
        poll_options.push({
          id: rId,
          name: _.random(0, 1123),
          votes: votes
        });
      }

      staticRes.data.push(
        {
          name: _.random(0, 100000) + "?",
          id: n+100,
          umbrella: false,
          votes: totalVotes,
          links: { web: '#' },
          description: "This poll is lorem ipsum dolor sit amet " + _.random(0, 50),
          creator: { display_name: _.random(0, 1000) },
          poll_options: poll_options
        }
      );
    });
  },
*/

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

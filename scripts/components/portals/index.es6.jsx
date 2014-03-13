/** @jsx React.DOM */

import _ from 'underscore';
import _str from 'underscore.string';
import CoercedPropsMixin from 'mixins/coerced-props';
module Community from 'entities/community';
import List from 'components/list';
import Olay from 'components/olay';
module Portal from 'entities/portal';
import Filters from 'components/portals/filters';
import ListItem from 'components/portals/list-item';
import BlankSlate from 'components/portals/blank-slate';
import Show from 'components/portals/show';
import React from 'react';

export default React.createClass({
  letterRegExps: _.times(26, function (n) {
    return String.fromCharCode(65 + n);
  }).reduce(function (letters, letter) {
    letters[letter] = new RegExp('^' + letter, 'i');
    return letters;
  }, {'': /.*/, Other: /^[^a-z]/i}),

  mixins: [CoercedPropsMixin],

  getCoercedProps: function () {
    return {
      portals: {
        type: Portal.Collection,
        alternates: {
          communityId:
            (new Community.Model({id: this.props.communityId})).get('portals')
        }
      }
    };
  },

  getDefaultProps: function () {
    return {
      umbrella: '',
      category: '',
      letter: '',
      query: '',
      searchableAttributes: ['name', 'short_name', 'keywords']
    };
  },

  getInitialState: function () {
    return {
      umbrella: this.props.umbrella,
      category: this.props.category,
      letter: this.props.letter,
      query: this.props.query,
      isLoading: false,
      error: null
    };
  },

  componentWillMount: function () {
    if (this.props.portals.length) return;
    this.setState({isLoading: true, error: null});
    this.props.portals.fetch({
      data: {all: true},
      success: this.handleSuccess,
      error: this.handleError
    });
  },

  handleSuccess: function () {
    this.setState({isLoading: false, error: null});
  },

  handleError: function (portals, er) {
    this.setState({isLoading: false, error: er.toString()});
  },

  handleChange: function (changes) {
    this.setState(changes);
  },

  openPortal: function (portal) {
    Olay.create({className: 'portals-show'}, <Show portal={portal} />).show();
  },

  matchesUmbrella: function (portal) {
    return !this.state.umbrella ||
      portal.umbrellaName() === this.state.umbrella;
  },

  matchesCategory: function (portal) {
    return !this.state.category ||
      portal.get('category').get('name') === this.state.category;
  },

  searchableWordsFor: function (portal) {
    return _str.words(
      _.values(portal.pick.apply(portal, this.props.searchableAttributes))
      .join(' ')
      .toLowerCase()
    );
  },

  matchesQuery: function (portal) {
    var query = this.state.query;
    if (!query) return true;
    var words = _str.words(query.toLowerCase());
    var searchableWords = this.searchableWordsFor(portal);
    return _.every(words, function (wordA) {
      return _.any(searchableWords, function (wordB) {
        return _str.startsWith(wordB, wordA);
      });
    });
  },

  matchesLetter: function (portal) {
    return this.letterRegExps[this.state.letter].test(portal.get('name'));
  },

  filteredPortals: function () {
    return new Portal.Collection(
      this.props.portals.filter(function (portal) {
        return (
          this.matchesUmbrella(portal) &&
          this.matchesCategory(portal) &&
          this.matchesLetter(portal) &&
          this.matchesQuery(portal)
        );
      }, this)
    );
  },

  clearFilter: function (name) {
    var change = {};
    change[name] = this.getDefaultProps()[name];
    this.setState(change);
  },

  clearAllFilters: function () {
    ['umbrella', 'category', 'letter', 'query'].forEach(this.clearFilter);
  },

  renderListItem: function (portal) {
    return (
      <ListItem
        key={portal.id}
        portal={portal}
        onClick={this.openPortal}
        redirect={this.props.redirect}
      />
    );
  },

  renderLoading: function () {
    return <div className='osw-inset-block'>Loading...</div>;
  },

  renderError: function (er) {
    return <div className='osw-inset-block'>{er}</div>;
  },

  renderBlankSlate: function () {
    return <BlankSlate onClick={this.clearAllFilters} />;
  },

  render: function () {
    var portals = this.filteredPortals();
    return (
      <div className='osw-portals-index'>
        <Filters
          onChange={this.handleChange}
          onClear={this.clearFilter}
          query={this.state.query}
          umbrella={this.state.umbrella}
          category={this.state.category}
          letter={this.state.letter}
          portals={portals}
        />
        <List
          key={portals.pluck('id').join()}
          collection={portals}
          isLoading={this.state.isLoading}
          error={this.state.error}
          shouldFetch={false}
          renderLoading={this.renderLoading}
          renderError={this.renderError}
          renderListItem={this.renderListItem}
          renderBlankSlate={this.renderBlankSlate}
          uniform={true}
          renderPageSize={18}
        />
      </div>
    );
  }
});

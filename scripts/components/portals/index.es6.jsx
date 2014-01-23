/** @jsx React.DOM */

import _ from 'underscore';
import _str from 'underscore.string';
import CoercedPropsMixin from 'mixins/coerced-props';
module Community from 'entities/community';
import List from 'components/list';
import Olay from 'components/olay';
module Portal from 'entities/portal';
import PortalsIndexFilters from 'components/portals/index/filters';
import PortalsListItem from 'components/portals/list-item';
import PortalsShow from 'components/portals/show';
import React from 'react';

export default React.createClass({
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
      umbrella: 'All Umbrellas',
      category: 'All Categories',
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
    this.setState({isLoading: true});
    this.props.portals.fetch({
      data: {all: true},
      success: this.onSuccess,
      error: this.onError
    });
  },

  onSuccess: function () {
    this.setState({isLoading: false});
  },

  onError: function (portals, er) {
    this.setState({isLoading: false, error: er.toString()});
  },

  openNewsPost: function (newsPost) {
    var component = <NewsPostsShow key={newsPost.id} newsPost={newsPost} />;
    (
      <Olay
        className='news-posts-show'
        component={component}
        options={{preserve: true}}
      />
    ).show();
  },

  renderListItem: function (portal) {
    return (
      <PortalsListItem
        key={portal.id}
        portal={portal}
        onTitleClick={this.openPortal}
      />
    );
  },

  matchesUmbrella: function (portal) {
    return this.state.umbrella === 'All Umbrellas' ||
      portal.umbrellaName() === this.state.umbrella;
  },

  matchesCategory: function (portal) {
    return this.state.category === 'All Categories' ||
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
    var letter = this.state.letter;
    return !letter || letter.test(portal.get('name'));
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

  render: function () {
    var portals = this.filteredPortals();
    return (
      <div className='portals-index'>
        <PortalsIndexFilters
          onChange={this.setState.bind(this)}
          query={this.state.query}
          umbrella={this.state.umbrella}
          category={this.state.category}
          letter={this.state.letter}
          portals={portals}
        />
        <List
          className='portals-index'
          collection={portals}
          renderListItem={this.renderListItem}
          shouldFetch={false}
        />
      </div>
    );
  }
});

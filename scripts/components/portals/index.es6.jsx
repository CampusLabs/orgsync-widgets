/** @jsx React.DOM */

import _ from 'underscore';
import _str from 'underscore.string';
import api from 'api';
import CoercedPropsMixin from 'mixins/coerced-props';
module Community from 'entities/community';
import Cursors from 'cursors';
import List from 'react-list';
import Olay from 'components/olay';
module Portal from 'entities/portal';
import Filters from 'components/portals/filters';
import ListItem from 'components/portals/list-item';
import Empty from 'components/portals/empty';
import Show from 'components/portals/show';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  letterRegExps: _.times(26, function (n) {
    return String.fromCharCode(65 + n);
  }).reduce(function (letters, letter) {
    letters[letter] = new RegExp('^' + letter, 'i');
    return letters;
  }, {'': /.*/, Other: /^[^a-z]/i}),

  comparator: function (a, b) {
    if (!a.umbrella !== !b.umbrella) return !a.umbrella ? -1 : 1;
    var aName = (a.name || '').toLowerCase();
    var bName = (b.name || '').toLowerCase();
    return aName < bName ? -1 : 1;
  },

  getDefaultProps: function () {
    return {
      umbrella: '',
      category: '',
      letter: '',
      query: '',
      searchableAttributes: ['name', 'short_name', 'keywords'],
      portals: []
    };
  },

  getInitialState: function () {
    return {
      umbrella: this.props.umbrella,
      category: this.props.category,
      letter: this.props.letter,
      query: this.props.query,
      portals: this.props.portals
    };
  },

  getUrl: function () {
    if (this.props.portalId) {
      return '/portals/' + this.props.portalId + '/portals';
    }
    return '/communities/' + this.props.communityId + '/portals';
  },

  fetch: function (cb) {
    if (this.state.portals.length) return cb(null, true);
    var update = this.update;
    var comparator = this.comparator;
    api.get(this.getUrl(), {all: true}, function (er, res) {
      if (er) cb(er);
      update({portals: {$set: res.data.slice().sort(comparator)}});
      cb(null, true);
    });
  },

  matchesUmbrella: function (portal) {
    var a = this.state.umbrella;
    var b = portal.umbrella ? portal.umbrella.name : 'Umbrella';
    return !a || a === b;
  },

  matchesCategory: function (portal) {
    var a = this.state.category;
    var b = portal.category.name;
    return !a || a === b;
  },

  searchableWordsFor: function (portal) {
    return _str.words(
      _.values(_.pick(portal, this.props.searchableAttributes))
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
    return this.letterRegExps[this.state.letter].test(portal.name);
  },

  portalMatchesFilters: function (portal) {
    return (
      this.matchesUmbrella(portal) &&
      this.matchesCategory(portal) &&
      this.matchesLetter(portal) &&
      this.matchesQuery(portal)
    );
  },

  getFilteredPortals: function () {
    return this.state.portals.filter(this.portalMatchesFilters);
  },

  renderListItem: function (portal) {
    var i = this.state.portals.indexOf(portal);
    return (
      <ListItem
        key={portal.id}
        redirect={this.props.redirect}
        cursors={{portal: this.getCursor('portals', i)}}
      />
    );
  },

  renderLoading: function () {
    return <div className='osw-inset-block'>Loading...</div>;
  },

  renderError: function (er) {
    return <div className='osw-inset-block'>{er}</div>;
  },

  renderEmpty: function () {
    return (
      <Empty
        cursors={{
          umbrella: this.getCursor('umbrella'),
          category: this.getCursor('category'),
          letter: this.getCursor('letter'),
          query: this.getCursor('query')
        }}
      />
    );
  },

  render: function () {
    var portals = this.getFilteredPortals();
    return (
      <div className='osw-portals-index'>
        {
          this.state.portals.length ?
          <Filters
            portals={portals}
            cursors={{
              query: this.getCursor('query'),
              umbrella: this.getCursor('umbrella'),
              category: this.getCursor('category'),
              letter: this.getCursor('letter')
            }}
          /> :
          null
        }
        <List
          items={portals}
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

import _ from 'underscore';
import _str from 'underscore.string';
import api from 'api';
import {Mixin} from 'cursors';
import ErrorBlock from 'components/ui/error-block';
import FetchList from 'components/ui/fetch-list';
import Filters from 'components/portals/filters';
import ListItem from 'components/portals/list-item';
import LoadingBlock from 'components/ui/loading-block';
import Empty from 'components/shared/empty';
import React from 'react';

var LETTER_REG_EXPS = _.times(26, function (n) {
  return String.fromCharCode(65 + n);
}).reduce(function (letters, letter) {
  letters[letter] = new RegExp('^' + letter, 'i');
  return letters;
}, {'': /.*/, Other: /^[^a-z]/i});

export default React.createClass({
  mixins: [Mixin],

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
      portals: [],
      filtersAreShowing: true
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

  componentWillMount: function () {
    if (this.state.portals.length) this.sortAndUpdate(this.state.portals);
  },

  getUrl: function () {
    const {portalId, communityId} = this.props;
    if (portalId) return `/portals/${portalId}/portals`;
    if (communityId) return `/communities/${communityId}/portals`;
  },

  fetch: function (cb) {
    const url = this.getUrl();
    if (this.state.portals.length || !url) return cb(null, true);
    api.get(url, {all: true}, _.partial(this.handleFetch, cb));
  },

  handleFetch: function (cb, er, res) {
    if (er) return cb(er);
    this.sortAndUpdate(res.data);
    cb(null, true);
  },

  sortAndUpdate: function (portals) {
    this.update({portals: {$set: portals.slice().sort(this.comparator)}});
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
    return LETTER_REG_EXPS[this.state.letter].test(portal.name);
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

  renderFilters: function (portals) {
    if (!this.state.portals.length || !this.props.filtersAreShowing) return;
    return (
      <Filters
        portals={portals}
        cursors={{
          query: this.getCursor('query'),
          umbrella: this.getCursor('umbrella'),
          category: this.getCursor('category'),
          letter: this.getCursor('letter')
        }}
      />
    );
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
    return <LoadingBlock />;
  },

  renderError: function (er) {
    return <ErrorBlock message={er.toString()} />;
  },

  renderEmpty: function () {
    return (
      <Empty
        objectName='portals'
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
        {this.renderFilters(portals)}
        <FetchList
          emptyRenderer={this.renderEmpty}
          errorRenderer={this.renderError}
          fetch={this.fetch}
          itemRenderer={this.renderListItem}
          items={portals}
          loadingRenderer={this.renderLoading}
          type='uniform'
          threshold={0}
        />
      </div>
    );
  }
});

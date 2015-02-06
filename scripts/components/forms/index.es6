import _ from 'underscore';
import _str from 'underscore.string';
import api from 'api';
import Cursors from 'cursors';
import List from 'react-list';
import Filters from 'components/forms/filters';
import FormsListItem from 'components/forms/list-item';
import Empty from 'components/forms/empty';
import React from 'react';

var PER_PAGE = 10;

export default React.createClass({
  mixins: [Cursors],

  comparator: function (a, b) {
    if (!a.umbrella !== !b.umbrella) return !a.umbrella ? -1 : 1;
    var aName = (a.name || '').toLowerCase();
    var bName = (b.name || '').toLowerCase();
    return aName < bName ? -1 : 1;
  },

  getDefaultProps: function () {
    return {
      category: '',
      query: '',
      searchableAttributes: ['name'],
      forms: [],
      filtersAreShowing: true
    };
  },

  getInitialState: function () {
    return {
      category: this.props.category,
      query: this.props.query,
      forms: this.props.forms
    };
  },

  componentWillMount: function () {
    if (this.state.forms.length) this.sortAndUpdate(this.state.forms);
  },

  fetch: function (cb) {
    api.get('/portals/:portal_id/forms', {
      portal_id: this.props.portalId,
      page: Math.floor(this.state.forms.length / PER_PAGE) + 1,
      per_page: PER_PAGE
    }, _.partial(this.handleFetch, cb));
  },

  handleFetch: function (cb, er, res) {
    console.log(res);
    if (er) return cb(er);
    this.update({
      forms: {$set: _.unique(this.state.forms.concat(res.data), 'id')}
    });
    cb(null, res.data.length < PER_PAGE);
  },

  sortAndUpdate: function (forms) {
    this.update({forms: {$set: forms.slice().sort(this.comparator)}});
  },

  matchesCategory: function(form) {
    var a = this.state.category;
    var b = form.category.name;
    return !a || a === b;
  },

  matchesQuery: function(form) {
    var query = this.state.query;
    if (!query) return true;
    var words = _str.words(query.toLowerCase());
    var searchableWords = this.searchableWordsFor(form);
    return _.every(words, function (wordA) {
      return _.any(searchableWords, function (wordB) {
        return _str.startsWith(wordB, wordA);
      });
    });
  },

  searchableWordsFor: function (form) {
    return _str.words(
      _.values(_.pick(form, this.props.searchableAttributes))
      .join(' ')
      .toLowerCase()
    );
  },

  formMatchesFilters: function(form) {
    return (
      this.matchesCategory(form) &&
      this.matchesQuery(form)
    );
  },

  getFilteredForms: function() {
    return this.state.forms.filter(this.formMatchesFilters);
  },

  renderFilters: function (forms) {
    if (!this.state.forms.length || !this.props.filtersAreShowing) return;
    return (
      <Filters
        forms={forms}
        cursors={{
          query: this.getCursor('query'),
          category: this.getCursor('category'),
        }}
      />
    );
  },

  renderListItem: function (form) {
    var i = this.state.forms.indexOf(form);
    return (
      <FormsListItem
        key={form.id}
        redirect={this.props.redirect}
        cursors={{form: this.getCursor('forms', i)}}
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
          category: this.getCursor('category'),
          query: this.getCursor('query')
        }}
      />
    );
  },

  render: function () {
    var forms = this.getFilteredForms();
    return (
      <div className='osw-forms-index'>
        {this.renderFilters(forms)}
        <List
          items={forms}
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

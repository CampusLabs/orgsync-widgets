import _ from 'underscore';
import _str from 'underscore.string';
import api from 'api';
import Cursors from 'cursors';
import Empty from 'components/shared/empty';
import ErrorBlock from 'components/ui/error-block';
import Filters from 'components/forms/filters';
import FormsListItem from 'components/forms/list-item';
import FetchList from 'components/ui/fetch-list';
import LoadingBlock from 'components/ui/loading-block';
import React from 'react';

var PER_PAGE = 10;

export default React.createClass({
  mixins: [Cursors],

  propTypes: {
    portalId: React.PropTypes.number
  },

  getDefaultProps: function () {
    return {
      category: '',
      forms: [],
      filtersAreShowing: true,
      query: '',
      searchableAttributes: ['name']
    };
  },

  getInitialState: function () {
    return {
      forms: this.props.forms,
      category: this.props.category,
      query: this.props.query
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
    if (er) return cb(er);
    this.update({
      forms: {$set: _.unique(this.state.forms.concat(res.data), 'id')}
    });
    cb(null, res.data.length < PER_PAGE);
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
          category: this.getCursor('category')
        }}
      />
    );
  },

  renderListItem: function (form) {
    var i = this.state.forms.indexOf(form);
    return (
      <FormsListItem
        key={form.id}
        cursors={{form: this.getCursor('forms', i)}}
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
        objectName='forms'
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
        <FetchList
          {...this.props}
          emptyRenderer={this.renderEmpty}
          errorRenderer={this.renderError}
          fetch={this.fetch}
          itemRenderer={this.renderListItem}
          items={forms}
          loadingRenderer={this.renderLoading}
          type='uniform'
        />
      </div>
    );
  }
});

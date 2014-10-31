import _ from 'underscore';
import app from 'orgsync-widgets';
import Button from 'components/button';
import Cursors from 'cursors';
import List from 'react-list';
import Popup from 'components/popup';
import React from 'react';
import Result from 'components/selector/result';
import Scope from 'components/selector/scope';
import store from 'entities/selector/store';
import Token from 'components/selector/token';
import {isArbitrary, getName} from 'entities/selector/item';

var SELECTED_SCOPE = {name: 'Selected', term: '_selected'};

var DOWNCASE = function (str) { return str.toLowerCase(); };

var NAME_COMPARATOR = _.compose(DOWNCASE, getName);

var SelectorIndex = React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      allowArbitrary: false,
      allowBrowse: true,
      allowEmptyQuery: true,
      browseText: 'Browse',
      fields: ['name'],
      hiddenInputName: 'selection',
      types: [],
      limit: Infinity,
      placeholder: 'Search...',
      query: '',
      renderPageSize: 20,
      scopes: [{name: 'Everything', term: '_all'}],
      search: store.search,
      value: [],
      view: 'inline'
    };
  },

  getInitialState: function () {
    return {
      activeIndex: 0,
      browseIsOpen: false,
      hasFocus: false,
      hasMouse: false,
      query: this.props.query,
      results: [],
      scope: this.props.scopes[0],
      value: _.sortBy(this.props.value, NAME_COMPARATOR)
    };
  },

  componentDidMount: function () {
    this.updateResults();
  },

  componentDidUpdate: function (__, prev) {
    if (this.state.scope !== prev.scope || this.state.query !== prev.query) {
      this.updateResults();
    }
    if (this.isActive(prev) && !this.isActive()) this.resetActiveIndex();
  },

  updateResults: function () {
    var results = this.props.search(this.getSearchOptions());
    var q = store.parse(this.state.query);
    if (this.props.allowArbitrary && q) {
      results = [{name: this.state.query}].concat(results);
    }
    if (this.props.view === 'inline' && !q) {
      results = _.reject(this.props.scopes, isArbitrary).concat(results);
    }
    this.update({results: {$set: results}});

    // Only reset the active index if the results at or before the current
    // active index were changed. This improves the UX by only forcing the
    // user's selection to change when it's necessary.
    var end = this.state.activeIndex + 1;
    if (!_.isEqual(results.slice(0, end), this.state.results.slice(0, end))) {
      this.resetActiveIndex(results);
    }
  },

  resetActiveIndex: function (results) {
    if (!results) results = this.state.results;
    this.update({activeIndex: {$set: this.restrictIndex(results)}});
  },

  handleScopeClick: function (scope) {
    if (scope !== this.state.scope) this.update({scope: {$set: scope}});
  },

  handleQueryChange: function (ev) {
    ev.stopPropagation();
    this.update({query: {$set: ev.target.value}});
  },

  handleKeyDown: function (ev) {
    ev.stopPropagation();
    var query = this.state.query;
    var key = ev.key;
    if (ev.ctrlKey) {
      if (ev.which === 80) key = 'ArrowUp';
      if (ev.which === 78) key = 'ArrowDown';
    }
    switch (key) {
    case 'Enter':
      var activeItem = this.state.results[this.state.activeIndex];
      if (!activeItem) break;
      this.handleResultClick(activeItem);
      this.update({query: {$set: ''}});
      break;
    case 'Escape':
      if (query) {
        this.update({query: {$set: ''}});
      } else {
        this.refs.query.getDOMNode().blur();
        this.update({hasFocus: {$set: false}, hasMouse: {$set: false}});
      }
      return false;
    case 'ArrowUp':
      this.incrActiveIndex(-1);
      return false;
    case 'ArrowDown':
      this.incrActiveIndex(1);
      return false;
    }
  },

  handleClick: function (ev) {
    ev.stopPropagation();
    this.refs.query.getDOMNode().focus();
  },

  handleFocus: function (ev) {
    ev.stopPropagation();
    this.update({hasFocus: {$set: true}});
  },

  handleBlur: function (ev) {
    ev.stopPropagation();
    this.update({hasFocus: {$set: false}});
  },

  handleMouseOver: function (ev) {
    ev.stopPropagation();
    if (this.state.hasFocus) this.update({hasMouse: {$set: true}});
  },

  handleMouseLeave: function (ev) {
    ev.stopPropagation();
    this.update({hasMouse: {$set: false}});
  },

  isActive: function (state) {
    if (!state) state = this.state;
    return state.hasFocus || state.hasMouse;
  },

  addValue: function (item) {
    if (this.isSelected(item)) return;
    var value = _.sortBy(this.state.value.concat(item), NAME_COMPARATOR);
    this.update({value: {$set: value}});
  },

  removeValue: function (item) {
    var existing = this.getSelected(item);
    if (!existing) return;
    var i = _.indexOf(this.state.value, existing);
    this.update({value: {$splice: [[i, 1]]}});
  },

  incrActiveIndex: function (dir) {
    this.setActiveIndex(this.state.activeIndex + dir);
  },

  restrictIndex: function (results, i) {
    if (i == null) {
      i = this.props.allowArbitrary && this.state.query.trim() ? 1 : 0;
    }
    return Math.max(0, Math.min(i, results.length - 1));
  },

  setActiveIndex: function (i) {
    i = this.restrictIndex(this.state.results, i);
    this.update({activeIndex: {$set: i}});
    if (this.isMounted()) this.refs.results.scrollTo(this.state.results[i]);
  },

  asHiddenInputValue: function (item) {
    return _.pick(item, isArbitrary(item) ? ['name'] : ['type', 'id']);
  },

  getClassName: function () {
    var classes = [
      'osw-selector-index',
      'osw-selector-index-' + this.props.view
    ];
    if (this.isActive()) classes.push('osw-selector-index-active');
    if (this.shouldShowResults()) {
      classes.push('osw-selector-index-results-visible');
    }
    return classes.join(' ');
  },

  handleResultClick: function (item) {
    this.isSelected(item) ? this.removeValue(item) : this.addValue(item);
    this.setActiveIndex(this.state.results.indexOf(item));
  },

  handleBrowseButtonClick: function (ev) {
    ev.stopPropagation();
    this.openBrowse();
  },

  openBrowse: function () {
    this.update({
      hasFocus: {$set: false},
      hasMouse: {$set: false},
      browseIsOpen: {$set: true}
    });
  },

  closeBrowse: function () {
    this.update({browseIsOpen: {$set: false}});
  },

  getSearchOptions: function () {
    var options = {
      boost_types: this.props.boostTypes,
      fields: this.props.fields,
      limit: this.props.limit,
      types: this.props.types
    };
    var scope = this.state.scope;
    if (scope) {
      options.scopes =
        this.props.view === 'inline' || scope.term === '_all' ?
        _.reject(this.props.scopes, {term: '_all'}) :
        [scope];
    }
    if (this.state.query) options.q = this.state.query;
    return options;
  },

  fetch: function (cb) {
    store.fetch(this.getSearchOptions(), _.partial(this.handleFetch, cb));
  },

  handleFetch: function (cb, er, done) {
    if (er) return cb(er);
    cb(null, done);
    this.updateResults();
  },

  shouldShowResults: function () {
    return this.props.view === 'browse' || (
      this.isActive() && (this.state.query.trim() || this.props.allowEmptyQuery)
    );
  },

  getSelected: function (item) {
    var a = this.asHiddenInputValue(item);
    var predicate = _.compose(_.partial(_.isEqual, a), this.asHiddenInputValue);
    return _.find(this.state.value, predicate);
  },

  isSelected: function (item) {
    return !!this.getSelected(item);
  },

  renderHiddenInput: function () {
    return (
      <input
        name={this.props.hiddenInputName}
        type='hidden'
        value={JSON.stringify(this.state.value.map(this.asHiddenInputValue))}
      />
    );
  },

  renderToken: function (item, i) {
    return (
      <Token
        key={i}
        item={item}
        onRemoveClick={_.partial(this.removeValue, item)}
      />
    );
  },

  renderTokens: function () {
    if (this.props.view === 'browse') return;
    return (
      <div className='osw-selector-index-tokens'>
        {this.state.value.map(this.renderToken)}
      </div>
    );
  },

  renderBrowseButton: function () {
    if (this.props.view === 'browse' || !this.props.allowBrowse) return;
    return (
      <Button
        className='osw-selector-index-browse-button'
        onClick={this.handleBrowseButtonClick}
      >
        {this.props.browseText}
      </Button>
    );
  },

  renderQuery: function () {
    return (
      <div className='osw-selector-index-query'>
        <input
          ref='query'
          value={this.state.query}
          onChange={this.handleQueryChange}
          placeholder={this.props.placeholder}
          disabled={this.state.scope === SELECTED_SCOPE}
        />
      </div>
    );
  },

  renderTokensAndQuery: function () {
    var classes = ['osw-selector-index-tokens-and-query'];
    if (this.state.scope === SELECTED_SCOPE) {
      classes.push('osw-selector-index-tokens-and-query-disabled');
    }
    return (
      <div className={classes.join(' ')}>
        {this.renderTokens()}
        {this.renderBrowseButton()}
        {this.renderQuery()}
      </div>
    );
  },

  renderScope: function (scope, i) {
    return (
      <Scope
        key={i}
        scope={scope}
        onClick={_.partial(this.handleScopeClick, scope)}
        onResultClick={this.handleResultClick}
        isSelected={this.isSelected(scope)}
        isActive={scope === this.state.scope}
      />
    );
  },

  renderScopes: function () {
    return (
      <List
        className='osw-selector-index-scopes'
        items={this.props.scopes}
        renderItem={this.renderScope}
        uniform={true}
        updateForScope={this.state.scope}
        updateForValue={this.state.value}
      />
    );
  },

  renderSelected: function () {
    return (
      <Scope
        scope={SELECTED_SCOPE}
        onClick={_.partial(this.handleScopeClick, SELECTED_SCOPE)}
        isActive={SELECTED_SCOPE === this.state.scope}
      />
    );
  },

  renderResult: function (item, i) {
    return (
      <Result
        key={i}
        item={item}
        onClick={_.partial(this.handleResultClick, item)}
        isSelected={
          this.state.scope !== SELECTED_SCOPE && this.isSelected(item)
        }
        isActive={this.state.results.indexOf(item) === this.state.activeIndex}
      />
    );
  },

  renderLoading: function () {
    return <div className='osw-selector-index-loading'>Loading...</div>;
  },

  renderEmpty: function () {
    return (
      <div className='osw-selector-index-empty'>
        {
          this.state.scope === SELECTED_SCOPE ?
          'Nothing selected.' :
          'No results found.'
        }
      </div>
    );
  },

  renderError: function () {
    return <div className='osw-selector-index-error'>An error occurred.</div>;
  },

  renderResults: function () {
    if (!this.shouldShowResults()) return;
    var selected = this.state.scope === SELECTED_SCOPE;
    var key = store.getQueryKey(this.getSearchOptions());
    return (
      <List
        key={key}
        ref='results'
        className='osw-selector-index-results'
        items={selected ? this.state.value : this.state.results}
        renderItem={this.renderResult}
        renderLoading={this.renderLoading}
        renderEmpty={this.renderEmpty}
        renderError={this.renderError}
        fetch={selected ? null : this.fetch}
        fetchInitially={!app.cache[key]}
        uniform={true}
        renderPageSize={this.props.renderPageSize}
        updateForActiveIndex={this.state.activeIndex}
        updateForValue={this.state.value}
      />
    );
  },

  renderBrowse: function () {
    if (!this.state.browseIsOpen) return;
    return (
      <SelectorIndex
        {...this.props}
        view='browse'
        query={this.state.query}
        cursors={{
          value: this.getCursor('value'),
          browseIsOpen: this.getCursor('browseIsOpen')
        }}
      />
    );
  },

  renderDoneButton: function () {
    if (!this.state.browseIsOpen) return;
    return (
      <div className='osw-selector-index-done-container'>
        <Button
          className='osw-selector-index-done'
          onClick={this.closeBrowse}
        >
          Done
        </Button>
      </div>
    );
  },

  renderPopup: function () {
    if (this.props.view === 'browse') return;
    return (
      <Popup
        ref='popup'
        title={this.props.browseText}
        name='selector-index'
        close={this.closeBrowse}
      >
        {this.renderBrowse()}
      </Popup>
    );
  },

  renderLeft: function () {
    if (this.props.view === 'inline') return;
    return (
      <div className='osw-selector-index-left'>
        {this.renderScopes()}
        <hr />
        {this.renderSelected()}
        {this.renderDoneButton()}
      </div>
    );
  },

  renderRight: function () {
    return (
      <div className='osw-selector-index-right'>
        {this.renderHiddenInput()}
        {this.renderTokensAndQuery()}
        {this.renderResults()}
      </div>
    );
  },

  render: function () {
    return (
      <div {...this.props}>
        <div
          className={this.getClassName()}
          onClick={this.handleClick}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          onMouseOver={this.handleMouseOver}
          onMouseLeave={this.handleMouseLeave}
          onKeyDown={this.handleKeyDown}
        >
          {this.renderLeft()}
          {this.renderRight()}
        </div>
        {this.renderPopup()}
      </div>
    );
  }
});

export default SelectorIndex;

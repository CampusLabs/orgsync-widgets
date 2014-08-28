/** @jsx React.DOM */

import _ from 'underscore';
import Button from 'components/button';
import Cursors from 'cursors';
import List from 'react-list';
import Popup from 'components/popup';
import React from 'react';
import Result from 'components/selector/result';
import Scope from 'components/selector/scope';
import store from 'entities/selector/store';
import Token from 'components/selector/token';
import {isArbitrary} from 'entities/selector/item';

var SelectorIndex = React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      value: [],
      query: '',
      scopes: [],
      hiddenInputName: 'selection',
      allowArbitrary: false,
      allowBrowse: true,
      allowEmptyQuery: true,
      browseText: 'Browse',
      view: 'inline',
      placeholder: 'Search...',
      renderPageSize: 20,
      indices: ['_all'],
      fields: ['name'],
      limit: Infinity,
      search: store.search
    };
  },

  getInitialState: function () {
    return {
      value: this.props.value,
      scope: this.props.scopes[0],
      query: this.props.query,
      hasMouse: false,
      hasFocus: false,
      activeIndex: 0,
      browseIsOpen: false,
      results: []
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
    if (this.props.allowArbitrary && store.parse(this.state.query)) {
      results = [{name: this.state.query}].concat(results);
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
    case 'Backspace':
      var value = this.state.value;
      if (!query && value.length) return this.removeValue(_.last(value));
      break;
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
    if (_.any(this.state.value, _.matches(item))) return;
    this.update({value: {$push: [item]}});
  },

  removeValue: function (item) {
    var value = this.state.value;
    var existing = _.find(value, _.matches(item));
    if (!existing) return;
    this.update({value: {$splice: [[value.indexOf(existing), 1]]}});
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
    return classes.join(' ');
  },

  handleResultClick: function (item) {
    if (_.any(this.state.value, _.matches(item))) this.removeValue(item);
    else this.addValue(item);
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
      indices: this.props.indices,
      fields: this.props.fields,
      indices_boost: this.props.indicesBoost,
      limit: this.props.limit
    };
    var scope = this.state.scope;
    if (scope) {
      options.scopes =
        scope.term === '_all' ?
        _.reject(this.props.scopes, _.matches({term: '_all'})) :
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

  isSelected: function (item) {
    var a = this.asHiddenInputValue(item);
    var predicate = _.compose(_.partial(_.isEqual, a), this.asHiddenInputValue);
    return _.any(this.state.value, predicate);
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

  renderTokensAndQuery: function () {
    return (
      <div className='osw-selector-index-tokens-and-query'>
        {this.renderTokens()}
        {this.renderBrowseButton()}
        {this.renderQuery()}
      </div>
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
        />
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
        selected={scope === this.state.scope}
      />
    );
  },

  renderScopes: function () {
    if (this.props.view === 'inline' || this.props.scopes.length < 2) return;
    return (
      <List
        className='osw-selector-index-scopes'
        items={this.props.scopes}
        renderItem={this.renderScope}
        uniform={true}
        updateForScope={this.state.scope}
      />
    );
  },

  renderResult: function (item, i) {
    return (
      <Result
        key={i}
        item={item}
        onClick={_.partial(this.handleResultClick, item)}
        selected={this.isSelected(item)}
        active={this.state.results.indexOf(item) === this.state.activeIndex}
      />
    );
  },

  renderLoading: function () {
    return <div className='osw-selector-index-loading'>Loading...</div>;
  },

  renderEmpty: function () {
    return <div className='osw-selector-index-empty'>No results found.</div>;
  },

  renderError: function () {
    return <div className='osw-selector-index-error'>An error occurred.</div>;
  },

  renderResults: function () {
    if (this.props.view === 'inline' && (
          !this.isActive() ||
          (!this.state.query.trim() && !this.props.allowEmptyQuery)
        )) return;
    var key = store.getQueryKey(this.getSearchOptions());
    return (
      <List
        key={key}
        ref='results'
        className='osw-selector-index-results'
        items={this.state.results}
        renderItem={this.renderResult}
        renderLoading={this.renderLoading}
        renderEmpty={this.renderEmpty}
        renderError={this.renderError}
        fetch={this.fetch}
        fetchInitially={!store.cache[key]}
        uniform={true}
        renderPageSize={this.props.renderPageSize}
        updateForActiveIndex={this.state.activeIndex}
        updateForValue={this.state.value}
      />
    );
  },

  renderBrowse: function () {
    if (!this.state.browseIsOpen) return;
    return this.transferPropsTo(
      <SelectorIndex
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
    if (!this.state.browseIsOpen || this.props.view !== 'browse') return;
    return <Button onClick={this.closeBrowse}>Done</Button>;
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

  render: function () {
    return (
      <div
        className={this.getClassName()}
        onClick={this.handleClick}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        onMouseOver={this.handleMouseOver}
        onMouseLeave={this.handleMouseLeave}
        onKeyDown={this.handleKeyDown}
      >
        {this.renderHiddenInput()}
        {this.renderTokensAndQuery()}
        {this.renderScopes()}
        {this.renderResults()}
        {this.renderDoneButton()}
        {this.renderPopup()}
      </div>
    );
  }
});

export default SelectorIndex;

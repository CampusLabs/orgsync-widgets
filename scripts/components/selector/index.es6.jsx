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
      value: [{name: 'wat'}],
      query: '',
      scopes: [{
        id: '_all',
        name: 'Everything'
      }],
      hiddenInputName: 'selection',
      allowArbitrary: false,
      allowBrowse: true,
      browseText: 'Browse',
      view: 'inline',
      placeholder: 'Search...',
      renderPageSize: 20,
      indicies: ['_all'],
      fields: ['name']
    };
  },

  getInitialState: function () {
    return {
      value: this.props.value,
      scope: this.props.scopes[0],
      query: this.props.query,
      hasMouse: false,
      hasFocus: false,
      isActive: false,
      activeIndex: 0,
      browseIsOpen: false
    };
  },

  componentDidUpdate: function (__, prev) {
    if (this.state.scope !== prev.scope || this.state.query !== prev.query) {
      this.updateResults(true);
    }
  },

  updateResults: function (resetActive) {
    var results = store.search(this.getSearchOptions());
    var query = store.parse(this.state.query);
    if (this.props.allowArbitrary && query) {
      results = [{name: query}].concat(results);
    }
    var deltas = {results: {$set: results}};
    if (resetActive) deltas.activeIndex = {$set: this.restrictIndex(results)};
    this.update(deltas);
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
      if (!query) return this.removeValue(_.last(this.state.value));
      break;
    case 'Enter':
      this.handleResultClick(this.state.results[this.state.activeIndex]);
      this.update({query: {$set: ''}});
      break;
    case 'Escape':
      if (query) {
        this.update({query: {$set: ''}});
      } else {
        this.refs.query.getDOMNode().blur();
        this.update({isActive: {$set: false}});
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
    this.update({hasFocus: {$set: true}, isActive: {$set: true}});
  },

  handleBlur: function (ev) {
    ev.stopPropagation();
    this.update({
      hasFocus: {$set: false},
      isActive: {$set: this.state.hasMouse}
    });
  },

  handleMouseEnter: function (ev) {
    ev.stopPropagation();
    this.update({hasMouse: {$set: true}});
  },

  handleMouseLeave: function (ev) {
    ev.stopPropagation();
    this.update({
      hasMouse: {$set: false},
      isActive: {$set: this.state.hasFocus}
    });
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
    if (this.state.isActive) classes.push('osw-selector-index-active');
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
    this.update({browseIsOpen: {$set: true}});
  },

  closeBrowse: function () {
    this.update({browseIsOpen: {$set: false}});
  },

  getSearchOptions: function () {
    var options = {
      scopes:
        this.state.scope.id === '_all' ?
        _.reject(this.props.scopes, _.matches({id: '_all'})) :
        [this.state.scope],
      indicies: this.props.indicies,
      fields: this.props.fields,
      selected: _.pluck(this.state.value, 'uid')
    };
    if (this.state.query) options.q = this.state.query;
    return options;
  },

  fetch: function (cb) {
    store.fetch(this.getSearchOptions(), _.partial(this.handleFetch, cb));
  },

  handleFetch: function (cb, er, done, options) {
    if (er) return cb(er);
    cb(null, done);
    this.updateResults(options.from === 0);
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
    if (this.props.view === 'browse') return;
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
        selected={scope === this.state.scope}
      />
    );
  },

  renderScopes: function () {
    if (this.props.view === 'inline') return;
    return (
      <List
        className='osw-selector-index-scopes'
        items={this.props.scopes}
        renderItem={this.renderScope}
        uniform={true}
      />
    );
  },

  renderResult: function (item, i) {
    return (
      <Result
        key={i}
        item={item}
        onClick={_.partial(this.handleResultClick, item)}
        selected={_.any(this.state.value, _.matches(item))}
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

  renderResults: function () {
    if (this.props.view === 'inline' && !this.state.isActive) return;
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
        fetch={this.fetch}
        fetchInitially={!store.cache[key]}
        uniform={true}
        renderPageSize={this.props.renderPageSize}
        activeIndex={this.state.activeIndex}
        value={this.state.value}
      />
    );
  },

  renderBrowse: function () {
    if (!this.state.browseIsOpen) return;
    return this.transferPropsTo(
      <SelectorIndex
        view='browse'
        query={this.state.query}
        cursors={{value: this.getCursor('value')}}
      />
    );
  },

  renderPopup: function () {
    if (this.props.view === 'browse') return;
    return (
      <Popup
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
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
        onKeyDown={this.handleKeyDown}
      >
        {this.renderHiddenInput()}
        {this.renderTokensAndQuery()}
        {this.renderScopes()}
        {this.renderResults()}
        {this.renderPopup()}
      </div>
    );
  }
});

export default SelectorIndex;

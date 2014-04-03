/** @jsx React.DOM */

import _ from 'underscore';
module Base from 'entities/base';
import CoercedPropsMixin from 'mixins/coerced-props';
import List from 'components/list';
import ListenersMixin from 'mixins/listeners';
import Olay from 'components/olay';
import React from 'react';
module SelectorItem from 'entities/selector-item';
import SelectorResult from 'components/selector/result';
import SelectorScope from 'components/selector/scope';
import SelectorToken from 'components/selector/token';

var SelectorIndex = React.createClass({
  mixins: [CoercedPropsMixin, ListenersMixin],

  getCoercedProps: function () {
    return {
      initialValue: {type: SelectorItem.Collection},
      scopes: {type: Base.Collection}
    };
  },

  getListeners: function () {
    return [{
      model: this.state.value,
      events: {
        'add remove': function () {
          this.forceUpdate();
          if (this.refs.results) this.refs.results.forceUpdate();
        }
      }
    }];
  },

  getDefaultProps: function () {
    return {
      initialValue: [],
      initialQuery: '',
      scopes: [],
      hiddenInputName: 'selection',
      allowArbitrary: false,
      allowBrowse: true,
      browseText: 'Browse',
      browse: false,
      placeholder: 'Search...',
      renderPageSize: 20,
      indicies: ['_all']
    };
  },

  getInitialState: function () {
    return {
      value: this.props.initialValue.clone(),
      scope: this.props.scopes.first(),
      query: this.props.initialQuery,
      results: null,
      hasMouse: false,
      hasFocus: false,
      isActive: false,
      activeResultId: null
    };
  },

  componentWillMount: function () {
    this.cache = {};
    this.updateResults(this.state.scope, this.state.query);
  },

  componentDidUpdate: function (prevProps, prevState) {
    if (prevState.isActive && !this.state.isActive) {
      this.setActiveResult(this.firstActiveResult(this.state.results));
    }
  },

  handleScopeClick: function (scope) {
    if (scope === this.state.scope) return;
    this.updateResults(scope, this.state.query);
    this.setState({scope: scope});
  },

  handleQueryChange: function (ev) {
    this.setQuery(ev.target.value);
  },

  handleKeyDown: function (ev) {
    var query = this.state.query;
    var key = ev.key;
    if (ev.ctrlKey) {
      if (ev.which === 80) key = 'ArrowUp';
      if (ev.which === 78) key = 'ArrowDown';
    }
    switch (key) {
    case 'Backspace':
      if (!query) return this.removeValue(this.state.value.last());
      break;
    case 'Enter':
      var selectorItem = this.state.results.get(this.state.activeResultId);
      if (this.state.value.get(selectorItem)) this.removeValue(selectorItem);
      else this.addValue(selectorItem);
      this.setQuery('');
      break;
    case 'Escape':
      if (query) {
        this.setQuery('');
      } else {
        this.refs.query.getDOMNode().blur();
        this.setState({isActive: false});
      }
      return false;
    case 'ArrowUp':
      this.incrActiveResult(-1);
      return false;
    case 'ArrowDown':
      this.incrActiveResult(1);
      return false;
    }
  },

  handleClick: function () {
    this.refs.query.getDOMNode().focus();
  },

  handleFocus: function () {
    this.setState({hasFocus: true, isActive: true});
  },

  handleBlur: function () {
    this.setState({hasFocus: false, isActive: this.state.hasMouse});
  },

  handleMouseEnter: function () {
    this.setState({hasMouse: true});
  },

  handleMouseLeave: function () {
    this.setState({hasMouse: false, isActive: this.state.hasFocus});
  },

  addValue: function (selectorItem) {
    this.state.value.add(selectorItem);
  },

  removeValue: function (selectorItem) {
    this.state.value.remove(selectorItem);
  },

  setQuery: function (query) {
    if (query === this.state.query) return;
    this.updateResults(this.state.scope, query);
    this.setState({query: query});
  },

  updateResults: function (scope, query) {
    query = query.trim().replace(/\s+/g, ' ');

    // Store current results in cache.
    var cache = this.cache[this.state.scope.id];
    if (!cache) cache = this.cache[this.state.scope.id] = {};
    this.previousResults = cache[this.state.query] = this.state.results;

    // Retrieve new results from cache.
    cache = this.cache[scope.id];
    if (!cache) cache = this.cache[scope.id] = {};
    var results = cache[query];
    if (!results) {
      results = cache[query] = new SelectorItem.Collection();
      results.hasFetched = false;
      results.once('request:end', function () { this.hasFetched = true; });
      if (this.props.allowArbitrary && query) results.add({name: query});
      if (this.previousResults) {
        var fillers = this.previousResults.reject(function (result) {
          return result.isArbitrary();
        });
        results.add(fillers);
        results.once('request:end', _.partial(results.remove, fillers));
      }
      results.once('request:end add', function () {
        if (results !== this.state.results) return;
        this.setActiveResult(this.firstActiveResult(results));
      }, this);
    }
    this.setState({results: results});
    this.setActiveResult(this.firstActiveResult(results));
  },

  incrActiveResult: function (dir) {
    var results = this.state.results;
    var current = results.get(this.state.activeResultId);
    var next;
    if (dir) next = results.at(results.indexOf(current) + dir);
    if (!next) next = current;
    this.setActiveResult(next);
    this.refs.results.scrollTo(next);
  },

  firstActiveResult: function (results) {
    var i = results.length > 1 && results.first().isArbitrary() ? 1 : 0;
    return results.at(i);
  },

  setActiveResult: function (selectorItem) {
    this.setState({activeResultId: (selectorItem || {}).id});
    if (this.refs.results) this.refs.results.forceUpdate();
  },

  fetchOptions: function () {
    var options = {
      selected: _.pluck(this.state.value.models, 'id'),
      indicies: this.props.indicies,
      scopes:
        this.state.scope.id === '_all' ?
        this.props.scopes.without(this.props.scopes.get('_all')) :
        [this.state.scope]
    };
    if (this.state.query) options.q = this.state.query;
    return options;
  },

  asHiddenInputValue: function (selectorItem) {
    var fields = selectorItem.isArbitrary() ? ['name'] : ['type', 'id'];
    return selectorItem.pick.apply(selectorItem, fields);
  },

  getClassName: function () {
    var classes = ['osw-selector-index'];
    classes.push(this.props.browse ? 'osw-browse' : 'osw-inline');
    if (this.state.isActive) classes.push('osw-active');
    return classes.join(' ');
  },

  handleResultClick: function (selectorItem) {
    if (this.state.value.get(selectorItem)) this.removeValue(selectorItem);
    else this.addValue(selectorItem);
    this.setState({activeResultId: selectorItem.id});
    this.refs.results.forceUpdate();
  },

  handleBrowseButtonClick: function (ev) {
    ev.stopPropagation();
    this.openBrowse();
  },

  handleBrowseCancel: function () {
    this.olay.hide();
  },

  handleBrowseDone: function (state) {
    this.state.value.set(state.value.models);
    this.olay.hide();
  },

  openBrowse: function () {
    var descriptor = SelectorIndex(_.extend({}, this.props, {
      browse: true,
      initialValue: this.state.value,
      initialQuery: this.state.query,
      onCancel: this.handleBrowseCancel,
      onDone: this.handleBrowseDone
    }));
    this.setQuery('');
    (this.olay = Olay.create({
      className: 'selector-index',
      showHideButton: false,
      options: {
        hideOnKeys: false,
        hideOnClick: false
      }
    }, descriptor)).show();
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

  renderToken: function (selectorItem, i) {
    return (
      <SelectorToken
        key={i}
        selectorItem={selectorItem}
        onRemoveClick={this.removeValue}
      />
    );
  },

  renderTokens: function () {
    return (
      <div className='osw-tokens'>{this.state.value.map(this.renderToken)}</div>
    );
  },

  renderBrowseButton: function () {
    if (this.props.browse) return;
    return (
      <input
        type='button'
        className='osw-button osw-browse-button'
        value={this.props.browseText}
        onClick={this.handleBrowseButtonClick}
      />
    );
  },

  renderTokensAndQuery: function () {
    return (
      <div className='osw-tokens-and-query'>
        {this.renderTokens()}
        {this.renderBrowseButton()}
        {this.renderQuery()}
      </div>
    );
  },

  renderQuery: function () {
    return (
      <div className='osw-query'>
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
      <SelectorScope
        key={i}
        scope={scope}
        onClick={this.handleScopeClick}
        selected={scope === this.state.scope}
      />
    );
  },

  renderScopes: function () {
    if (!this.props.browse) return;
    return (
      <List
        className='osw-scopes'
        key={this.state.scope.id}
        collection={this.props.scopes}
        renderListItem={this.renderScope}
        shouldFetch={false}
        uniform={true}
      />
    );
  },

  renderResult: function (selectorItem, i) {
    return (
      <SelectorResult
        key={i}
        selectorItem={selectorItem}
        onClick={this.handleResultClick}
        selected={!!this.state.value.get(selectorItem)}
        active={selectorItem.id === this.state.activeResultId}
      />
    );
  },

  renderResults: function () {
    if (!this.props.browse && !this.state.isActive) return;
    return (
      <List
        className='osw-results'
        ref='results'
        key={JSON.stringify(_.pick(this.state, 'scope', 'query'))}
        collection={this.state.results}
        renderListItem={this.renderResult}
        fetchOptions={this.fetchOptions}
        uniform={true}
        renderPageSize={this.props.renderPageSize}
        initialFetchPage={this.state.results.hasFetched ? null : 1}
      />
    );
  },

  renderCancel: function () {
    var onCancel = this.props.onCancel;
    if (!onCancel) return;
    return (
      <input
        type='button'
        className='osw-button osw-cancel'
        onClick={onCancel}
        value='Cancel'
      />
    );
  },

  renderDone: function () {
    var onDone = this.props.onDone;
    if (!onDone) return;
    return (
      <input
        type='button'
        className='osw-button osw-done'
        onClick={_.partial(onDone, this.state)}
        value='Done'
      />
    );
  },

  renderFinishButtons: function () {
    var cancel = this.renderCancel();
    var done = this.renderDone();
    if (!cancel || !done) return;
    return <div className='osw-finish-buttons'>{cancel}{done}</div>;
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
        {this.renderFinishButtons()}
      </div>
    );
  }
});

export default SelectorIndex;

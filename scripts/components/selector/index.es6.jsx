/** @jsx React.DOM */

import _ from 'underscore';
module Base from 'entities/base';
import CoercedPropsMixin from 'mixins/coerced-props';
import List from 'components/list';
import React from 'react';
module SelectorItem from 'entities/selector-item';
import SelectorResult from 'components/selector/result';
import SelectorScope from 'components/selector/scope';
import SelectorToken from 'components/selector/token';

export default React.createClass({
  mixins: [CoercedPropsMixin],

  getCoercedProps: function () {
    return {
      initialValue: {type: SelectorItem.Collection},
      scopes: {type: Base.Collection}
    };
  },

  getDefaultProps: function () {
    return {
      initialValue: [],
      hiddenInputName: 'selection'
    };
  },

  getInitialState: function () {
    return {
      value: this.props.initialValue,
      scope: this.props.scopes.first(),
      query: '',
      results: new SelectorItem.Collection()
    };
  },

  onScopeClick: function (scope) {
    if (scope === this.state.scope) return;
    this.setState({scope: scope, results: new SelectorItem.Collection()});
  },

  onQueryChange: function (ev) {
    this.setQuery(ev.target.value);
  },

  onKeyDown: function (ev) {
    var query = this.state.query;
    if (ev.which === 8 && !query) {
      return this.removeSelectorItem(this.state.value.last());
    }
    if (ev.which !== 13 || !query) return;
    this.setQuery('');
    this.addSelectorItem({name: query});
  },

  addSelectorItem: function (selectorItem) {
    var value = this.state.value;
    if (value.get(selectorItem)) return;
    this.setValue(value.models.concat(selectorItem));
  },

  removeSelectorItem: function (selectorItem) {
    var value = this.state.value;
    if (!(selectorItem = value.get(selectorItem))) return;
    this.setValue(value.without(selectorItem));
  },

  setValue: function (selectorItems) {
    this.setState({value: new SelectorItem.Collection(selectorItems)});
    this.refs.results.forceUpdate();
  },

  setQuery: function (query) {
    if (query === this.state.query) return;
    this.setState({query: query, results: new SelectorItem.Collection()});
  },

  fetchOptions: function () {
    var options = {
      selected: _.pluck(this.state.value.models, 'id'),
      indicies: this.props.indicies,
      scopes:
        this.state.scope.id === '_all' ?
        _.without(this.props.scopes.pluck('id'), '_all') :
        [this.state.scope.id]
    };
    if (this.state.query) options.q = this.state.query;
    return options;
  },

  asHiddenInputValue: function (selectorItem) {
    var fields = selectorItem.isArbitrary() ? ['name'] : ['type', 'id'];
    return selectorItem.pick.apply(selectorItem, fields);
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
        onRemoveClick={this.removeSelectorItem}
      />
    );
  },

  renderTokens: function () {
    return (
      <div className='tokens'>{this.state.value.map(this.renderToken)}</div>
    );
  },

  renderQuery: function () {
    return (
      <input
        className='query'
        value={this.state.query}
        onChange={this.onQueryChange}
        onKeyDown={this.onKeyDown}
      />
    );
  },

  renderScope: function (scope, i) {
    return (
      <SelectorScope
        key={i}
        scope={scope}
        onClick={this.onScopeClick}
        selected={scope === this.state.scope}
      />
    );
  },

  renderScopes: function () {
    return (
      <List
        className='scopes'
        key={this.state.scope.id}
        collection={this.props.scopes}
        renderListItem={this.renderScope}
        shouldFetch={false}
        renderPageSize={10}
      />
    );
  },

  renderResult: function (selectorItem, i) {
    var selected = this.state.value.get(selectorItem);
    return (
      <SelectorResult
        key={i}
        selectorItem={selectorItem}
        onClick={selected ? this.removeSelectorItem : this.addSelectorItem}
        selected={selected}
      />
    );
  },

  renderResults: function () {
    return (
      <List
        className='results'
        ref='results'
        key={JSON.stringify(_.pick(this.state, 'scope', 'query'))}
        collection={this.state.results}
        renderListItem={this.renderResult}
        fetchOptions={this.fetchOptions}
        uniform={true}
      />
    );
  },

  render: function () {
    return (
      <div className='selector-index'>
        {this.renderHiddenInput()}
        {this.renderTokens()}
        {this.renderQuery()}
        <br />
        {this.renderScopes()}
        {this.renderResults()}
      </div>
    );
  }
});

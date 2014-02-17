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
    this.setState({
      scope: scope,
      results: new SelectorItem.Collection()
    });
  },

  onQueryChange: function (ev) {
    this.setState({
      query: ev.target.value,
      results: new SelectorItem.Collection()
    });
  },

  onKeyDown: function (ev) {
    var query = this.state.query;
    if (ev.which !== 13 || !query) return;
    this.addSelectorItem({name: query});
    this.setState({query: ''});
  },

  addSelectorItem: function (selectorItem) {
    this.setState({
      value: new SelectorItem.Collection(
        this.state.value.models.concat(selectorItem)
      )
    });
  },

  removeSelectorItem: function (selectorItem) {
    this.setState({
      value:
        new SelectorItem.Collection(this.state.value.without(selectorItem))
    });
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

  renderHiddenInput: function () {
    return (
      <input
        name={this.props.hiddenInputName}
        type='hidden'
        value={JSON.stringify(_.pluck(this.state.value.models, 'id'))}
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
        key={this.state.scope.id}
        collection={this.props.scopes}
        renderListItem={this.renderScope}
        shouldFetch={false}
        renderPageSize={10}
      />
    );
  },

  renderResult: function (selectorItem, i) {
    return (
      <SelectorResult
        key={i}
        selectorItem={selectorItem}
        onClick={this.addSelectorItem}
      />
    );
  },

  renderResults: function () {
    return (
      <List
        key={JSON.stringify(_.pick(this.state, 'value', 'scope', 'query'))}
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
        {this.renderScopes()}
        {this.renderResults()}
      </div>
    );
  }
});

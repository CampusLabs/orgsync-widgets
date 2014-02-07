/** @jsx React.DOM */

import Backbone from 'backbone';
import CoercedPropsMixin from 'mixins/coerced-props';
import List from 'components/list';
import React from 'react';
module SelectorInput from 'components/selector/input';
module SelectorResult from 'components/selector/result';
module SelectorToken from 'entities/selector-token';

export default React.createClass({
  mixins: [CoercedPropsMixin],

  getCoercedProps: function () {
    return {
      scope: {
        type: Backbone.Collection
      },
      value: {
        type: SelectorToken.Collection
      }
    };
  },

  getDefaultProps: function () {
    return {
      allowArbitrary: false,
      maxItems: Infinity,
      scope: [],
      value: []
    };
  },

  getInitialState: function () {
    return {
      scope: this.props.scope
    };
  },

  componentWillMount: function () {
    this.results = new SelectorToken.Collection();
  },

  fetchOptions: function () {
    return {
      indicies: this.props.indicies,
      scope: this.state.scope.pluck('id')
    };
  },

  renderScope: function (scope) {
    return <div>{scope.get('name')}</div>
  },

  renderResult: function (selectorToken) {
    return <div>{JSON.stringify(selectorToken)}</div>;
  },

  render: function () {
    var Input = SelectorInput.default;
    return (
      <div className='selector-browse'>
        <Input
          browsing={true}
          allowArbitrary={this.props.allowArbitrary}
          maxItems={this.props.maxItems}
          value={this.props.value}
          scope={this.props.scope}
        />
        <div className='filters'>
          <div>All</div>
          <List
            className='list'
            collection={this.props.scope}
            renderListItem={this.renderScope}
            shouldFetch={false}
          />
        </div>
        <div className='results'>
          <List
            className='list'
            collection={this.results}
            renderListItem={this.renderResult}
            fetchOptions={this.fetchOptions}
          />
        </div>
      </div>
    );
  }
});

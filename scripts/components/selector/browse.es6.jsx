/** @jsx React.DOM */

import CoercedPropsMixin from 'mixins/coerced-props';
import List from 'components/list';
import React from 'react';
module SelectorInput from 'components/selector/input';
module SelectorToken from 'entities/selector-token';

export default React.createClass({
  mixins: [CoercedPropsMixin],

  getCoercedProps: function () {
    return {
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
      scope: this.state.scope
    };
  },

  renderListItem: function (selectorToken) {
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
        <List
          collection={this.results}
          renderListItem={this.renderListItem}
          fetchOptions={this.fetchOptions}
        />
      </div>
    );
  }
});

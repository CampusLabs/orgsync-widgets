/** @jsx React.DOM */

import React from 'react';
module SelectorInput from 'components/selector/input';

export default React.createClass({
  getInitialState: function () {
    return {
      scope: this.props.scope
    };
  },

  fetchOptions: function () {
    return {
      indicies: this.props.indicies,
      scope: this.state.scope,
      query: '' // grab from SelectorInput
    };
  },

  render: function () {
    return this.transferPropsTo(SelectorInput.default());
  }
});

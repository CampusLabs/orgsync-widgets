/** @jsx React.DOM */

import React from 'react';
import Selector from 'components/portals/selector';

export default React.createClass({
  toOption: function (matches, name) {
    return {id: name, name: name + ' (' + matches.length + ')'};
  },

  renderOption: function (option) {
    return <option key={option.id} value={option.id}>{option.name}</option>;
  },

  renderOptions: function () {
    return [{id: '', name: this.props.allOption}].concat(
      this.props.portals.chain()
        .map(this.props.getFacet)
        .groupBy()
        .map(this.toOption)
        .sortBy('name')
        .value()
    ).map(this.renderOption);
  },

  render: function () {
    return this.transferPropsTo(
      <Selector renderOptions={this.renderOptions} />
    );
  }
});

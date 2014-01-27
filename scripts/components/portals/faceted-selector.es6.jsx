/** @jsx React.DOM */

import _ from 'underscore';
import React from 'react';
import Selector from 'components/portals/selector';

export default React.createClass({
  renderOptions: function () {
    var models = this.props.portals.models;
    var allOption = this.props.allOption;
    return [{id: '', name: allOption + ' (' + models.length + ')'}].concat(
      _.chain(models)
        .map(this.props.getFacet)
        .groupBy()
        .map(function (count, name) {
          return {id: name, name: name + ' (' + count.length + ')'};
        })
        .sortBy('name')
        .value()
    ).map(function (option) {
      return <option key={option.id} value={option.id}>{option.name}</option>;
    });
  },

  render: function () {
    return this.transferPropsTo(
      <Selector renderOptions={this.renderOptions} />
    );
  }
});

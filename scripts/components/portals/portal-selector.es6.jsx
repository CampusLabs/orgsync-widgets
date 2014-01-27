/** @jsx React.DOM */

import _ from 'underscore';
import React from 'react';

export default React.createClass({
  options: function () {
    var models = this.props.portals.models;
    var allOption = this.props.allOption;
    return [{id: '', name: allOption + ' (' + models.length + ')'}].concat(
      _.chain(models)
        .map(this.props.getName)
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
    return (
      <div className={'portals-selector ' + this.props.name}>
        <select
          name={this.props.name}
          value={this.props.value}
          onChange={this.props.onChange}
        >
          {this.options()}
        </select>
      </div>
    );
  }
});

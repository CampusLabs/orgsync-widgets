/** @jsx React.DOM */

import _ from 'underscore';
import React from 'react';

export default React.createClass({
  onQueryChange: function () {
    this.props.onChange({query: this.refs.query.getDOMNode().value});
  },

  onUmbrellaChange: function () {
    this.props.onChange({umbrella: this.refs.umbrella.getDOMNode().value});
  },

  onCategoryChange: function () {
    this.props.onChange({category: this.refs.category.getDOMNode().value});
  },

  umbrellaOptions: function () {
    return this.options('Umbrellas', function (portal) {
      return portal.umbrellaName();
    });
  },

  categoryOptions: function () {
    return this.options('Categories', function (portal) {
      return portal.get('category').get('name');
    });
  },

  options: function (type, getName) {
    var models = this.props.portals.models;
    return [
      {id: 'All ' + type, name: 'All ' + type + ' (' + models.length + ')'}
    ].concat(
      _.chain(models)
        .reduce(function (options, portal) {
          var name = getName(portal);
          if (!options[name]) options[name] = {name: name, count: 0};
          ++options[name].count;
          return options;
        }, {})
        .map(function (option) {
          return {
            id: option.name,
            name: option.name + ' (' + option.count + ')'
          };
        })
        .sortBy('name')
        .value()
    ).map(function (option) {
      return <option key={option.id} value={option.id}>{option.name}</option>;
    });
  },

  render: function () {
    return (
      <div className='portals-index-filters'>
        <input
          ref='query'
          value={this.props.query}
          onChange={this.onQueryChange}
        />
        <div className='select-wrapper'>
          <select
            ref='umbrella'
            value={this.props.umbrella}
            onChange={this.onUmbrellaChange}
          >
            {this.umbrellaOptions()}
          </select>
        </div>
        <div className='select-wrapper'>
          <select
            ref='category'
            value={this.props.category}
            onChange={this.onCategoryChange}
          >
            {this.categoryOptions()}
          </select>
        </div>
      </div>
    );
  }
});

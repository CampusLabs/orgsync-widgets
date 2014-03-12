/** @jsx React.DOM */

import CategorySelector from 'components/portals/category-selector';
import LetterTable from 'components/portals/letter-table';
import Query from 'components/portals/query';
import React from 'react';
import Summary from 'components/portals/summary';
import UmbrellaSelector from 'components/portals/umbrella-selector';

export default React.createClass({
  handleChange: function (ev) {
    var change = {};
    change[ev.target.name] = ev.target.value;
    this.props.onChange(change);
  },

  handleLetterClick: function (letter) {
    this.props.onChange({letter: letter});
  },

  render: function () {
    return (
      <div className='portals-filters'>
        <Query value={this.props.query} onChange={this.handleChange} />
        <UmbrellaSelector
          portals={this.props.portals}
          value={this.props.umbrella}
          onChange={this.handleChange}
        />
        <CategorySelector
          portals={this.props.portals}
          value={this.props.category}
          onChange={this.handleChange}
        />
        <LetterTable
          portals={this.props.portals}
          value={this.props.letter}
          onClick={this.handleLetterClick}
        />
        {this.transferPropsTo(<Summary />)}
      </div>
    );
  }
});

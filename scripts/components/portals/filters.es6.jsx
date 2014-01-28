/** @jsx React.DOM */

import CategorySelector from 'components/portals/category-selector';
import LetterSelector from 'components/portals/letter-selector';
import Query from 'components/portals/query';
import React from 'react';
import Summary from 'components/portals/summary';
import UmbrellaSelector from 'components/portals/umbrella-selector';

export default React.createClass({
  onChange: function (ev) {
    var change = {};
    change[ev.target.name] = ev.target.value;
    this.props.onChange(change);
  },

  render: function () {
    return (
      <div className='portals-filters'>
        <Query value={this.props.query} onChange={this.onChange} />
        <LetterSelector value={this.props.letter} onChange={this.onChange} />
        <UmbrellaSelector
          portals={this.props.portals}
          value={this.props.umbrella}
          onChange={this.onChange}
        />
        <CategorySelector
          portals={this.props.portals}
          value={this.props.category}
          onChange={this.onChange}
        />
        {this.transferPropsTo(<Summary />)}
      </div>
    );
  }
});

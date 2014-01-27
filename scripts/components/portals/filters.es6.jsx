/** @jsx React.DOM */

import LetterSelector from 'components/portals/letter-selector';
import PortalSelector from 'components/portals/portal-selector';
import Query from 'components/portals/query';
import React from 'react';

export default React.createClass({
  onChange: function (ev) {
    var change = {};
    change[ev.target.name] = ev.target.value;
    this.props.onChange(change);
  },

  getUmbrellaName: function (portal) {
    return portal.umbrellaName();
  },

  getCategoryName: function (portal) {
    return portal.get('category').get('name');
  },

  render: function () {
    return (
      <div className='portals-filters'>
        <Query value={this.props.query} onChange={this.onChange} />
        <LetterSelector value={this.props.letter} onChange={this.onChange} />
        <PortalSelector
          portals={this.props.portals}
          name='umbrella'
          value={this.props.umbrella}
          getName={this.getUmbrellaName}
          allOption='All Umbrellas'
          onChange={this.onChange}
        />
        <PortalSelector
          portals={this.props.portals}
          name='category'
          value={this.props.category}
          getName={this.getCategoryName}
          allOption='All Categories'
          onChange={this.onChange}
        />
      </div>
    );
  }
});

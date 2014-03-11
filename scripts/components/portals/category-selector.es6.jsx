/** @jsx React.DOM */

import FacetedSelector from 'components/portals/faceted-selector';
import React from 'react';

export default React.createClass({
  getFacet: function (portal) { return portal.get('category').get('name'); },

  render: function () {
    return this.transferPropsTo(
      <FacetedSelector
        name='category'
        allOption='All Categories'
        getFacet={this.getFacet}
        icon='icon-invoice'
      />
    );
  }
});

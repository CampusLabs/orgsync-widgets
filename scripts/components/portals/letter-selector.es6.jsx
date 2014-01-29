/** @jsx React.DOM */

import FacetedSelector from 'components/portals/faceted-selector';
import React from 'react';

export default React.createClass({
  getFacet: function (portal) {
    var letter = portal.get('name')[0].toUpperCase();
    return (/[A-Z]/).test(letter) ? letter.toUpperCase() : 'Other';
  },

  render: function () {
    return this.transferPropsTo(
      <FacetedSelector
        name='letter'
        allOption='Starting with...'
        getFacet={this.getFacet}
      />
    );
  }
});

/** @jsx React.DOM */

import Cursors from 'cursors';
import FacetedSelector from 'components/portals/faceted-selector';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getFacet: function (portal) {
    return portal.umbrella ? portal.umbrella.name : 'Umbrella';
  },

  render: function () {
    return this.transferPropsTo(
      <FacetedSelector
        name='umbrella'
        allOption='All Umbrellas'
        getFacet={this.getFacet}
        className='oswi-umbrella'
      />
    );
  }
});

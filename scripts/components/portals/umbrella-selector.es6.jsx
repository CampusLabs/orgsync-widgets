/** @jsx React.DOM */

import FacetedSelector from 'components/portals/faceted-selector';
import React from 'react/addons';

export default React.createClass({
  getFacet: function (portal) { return portal.umbrellaName(); },

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

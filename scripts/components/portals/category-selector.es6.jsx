/** @jsx React.DOM */

import Cursors from 'cursors';
import FacetedSelector from 'components/portals/faceted-selector';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getFacet: function (portal) { return portal.category.name; },

  render: function () {
    return this.transferPropsTo(
      <FacetedSelector
        name='category'
        allOption='All Categories'
        getFacet={this.getFacet}
        className='oswi-book'
      />
    );
  }
});

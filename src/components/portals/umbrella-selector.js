import Cursors from 'cursors';
import FacetedSelector from '../shared/faceted-selector';
import joinClassNames from '../../utils/join-class-names';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getFacet: function (portal) {
    return portal.umbrella ? portal.umbrella.name : 'Umbrella';
  },

  render: function () {
    return (
      <FacetedSelector
        {...this.props}
        objects={this.props.portals}
        className={joinClassNames('oswi-umbrella', this.props.className)}
        name='umbrella'
        allOption='All Umbrellas'
        getFacet={this.getFacet}
      />
    );
  }
});

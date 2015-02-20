import Cursors from 'cursors';
import FacetedSelector from 'components/shared/faceted-selector';
import joinClassNames from 'utils/join-class-names';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getFacet: function (object) { return object.category.name; },

  render: function () {
    return (
      <FacetedSelector
        {...this.props}
        className={joinClassNames('oswi-book', this.props.className)}
        name='category'
        allOption='All Categories'
        getFacet={this.getFacet}
      />
    );
  }
});

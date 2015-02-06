import Cursors from 'cursors';
import FacetedSelector from 'components/forms/faceted-selector';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getFacet: function (form) { return form.category.name; },

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

import Cursors from 'cursors';
import FacetedSelector from 'components/shared/faceted-selector';
import joinClassNames from 'utils/join-class-names';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  propTypes: {
    objects: React.PropTypes.array.isRequired,
    onChange: React.PropTypes.func.isRequired,
    showMatchCount: React.PropTypes.bool
  },

  getFacet: function (object) { return object.category.name; },

  render: function () {
    return (
      <FacetedSelector
        {...this.props}
        allOption='All Categories'
        className={joinClassNames('oswi-book', this.props.className)}
        getFacet={this.getFacet}
        name='category'
      />
    );
  }
});

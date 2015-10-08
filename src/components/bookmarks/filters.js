import {Mixin as Cursors} from 'cursors';
import FacetedSelector from 'components/shared/faceted-selector';
import joinClassNames from 'utils/join-class-names';
import Query from 'components/shared/query';
import React from 'react';
import Summary from 'components/shared/summary';

export default React.createClass({
  mixins: [Cursors],

  handleChange(ev) {
    var deltas = {};
    deltas[ev.target.name] = {$set: ev.target.value};
    this.update(deltas);
  },

  render() {
    return (
      <div className='osw-bookmarks-filters'>
        <Query value={this.state.query} onChange={this.handleChange} />
        <Summary
          {...this.props}
          filterKeys={['query']}
          objects={this.props.bookmarks}
          showMessage={false}
        />
      </div>
    );
  }
});

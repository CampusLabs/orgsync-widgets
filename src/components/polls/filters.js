import Cursors from 'cursors';
import FacetedSelector from '../shared/faceted-selector';
import joinClassNames from '../../utils/join-class-names';
import Query from '../shared/query';
import React from 'react';
import Summary from '../shared/summary';

export default React.createClass({
  mixins: [Cursors],

  handleChange: function (ev) {
    var deltas = {};
    deltas[ev.target.name] = {$set: ev.target.value};
    this.update(deltas);
  },

  render: function () {
    return (
      <div className='osw-polls-filters'>
        <Query value={this.state.query} onChange={this.handleChange} />
        <FacetedSelector
          {...this.props}
          allOption='All Categories'
          className={joinClassNames('oswi-book', this.props.className)}
          getFacet={this.props.getFacet}
          name='category'
          objects={this.props.polls}
          onChange={this.handleChange}
          showMatchCount={false}
          value={this.state.category}
        />
        <Summary
          {...this.props}
          filterKeys={['query', 'category']}
          objects={this.props.polls}
          showMessage={false}
        />
      </div>
    );
  }
});

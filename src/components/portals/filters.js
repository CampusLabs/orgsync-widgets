import CategorySelector from '../shared/category-selector';
import Cursors from 'cursors';
import LetterTable from './letter-table';
import Query from '../shared/query';
import React from 'react';
import Summary from '../shared/summary';
import UmbrellaSelector from './umbrella-selector';

export default React.createClass({
  mixins: [Cursors],

  handleChange: function (ev) {
    var deltas = {};
    deltas[ev.target.name] = {$set: ev.target.value};
    this.update(deltas);
  },

  render: function () {
    return (
      <div className='osw-portals-filters'>
        <Query value={this.state.query} onChange={this.handleChange} />
        <UmbrellaSelector
          portals={this.props.portals}
          value={this.state.umbrella}
          onChange={this.handleChange}
        />
        <CategorySelector
          objects={this.props.portals}
          value={this.state.category}
          onChange={this.handleChange}
        />
        <LetterTable cursors={{letter: this.getCursor('letter')}} />
        <Summary
          {...this.props}
          objects={this.props.portals}
          objectName='portal'
          filterKeys={['query', 'umbrella', 'category', 'letter']}
        />
      </div>
    );
  }
});

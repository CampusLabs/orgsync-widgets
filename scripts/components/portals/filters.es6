import CategorySelector from 'components/portals/category-selector';
import Cursors from 'cursors';
import LetterTable from 'components/portals/letter-table';
import Query from 'components/portals/query';
import React from 'react';
import Summary from 'components/portals/summary';
import UmbrellaSelector from 'components/portals/umbrella-selector';

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
          portals={this.props.portals}
          value={this.state.category}
          onChange={this.handleChange}
        />
        <LetterTable cursors={{letter: this.getCursor('letter')}} />
        <Summary {...this.props} />
      </div>
    );
  }
});

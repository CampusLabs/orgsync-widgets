import CategorySelector from 'components/shared/category-selector';
import Cursors from 'cursors';
import Query from 'components/shared/query';
import React from 'react';
import Summary from 'components/shared/summary';

export default React.createClass({
  mixins: [Cursors],

  propTypes: {
    objects: React.PropTypes.array
  },

  handleChange: function (ev) {
    var deltas = {};
    deltas[ev.target.name] = {$set: ev.target.value};
    this.update(deltas);
  },

  render: function () {
    return (
      <div className='osw-forms-filters'>
        <Query value={this.state.query} onChange={this.handleChange} />
        <CategorySelector
          showMatchCount={false}
          objects={this.props.forms}
          value={this.state.category}
          onChange={this.handleChange}
        />
        <Summary
          {...this.props}
          objects={this.props.forms}
          showMessage={false}
          filterKeys={['query', 'category']}
        />
      </div>
    );
  }
});

import CategorySelector from 'components/shared/category-selector';
import {Mixin as Cursors} from 'cursors';
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
          objects={this.props.forms}
          onChange={this.handleChange}
          showMatchCount={false}
          value={this.state.category}
        />
        <Summary
          {...this.props}
          filterKeys={['query', 'category']}
          objects={this.props.forms}
          showMessage={false}
        />
      </div>
    );
  }
});

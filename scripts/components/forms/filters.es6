import CategorySelector from 'components/forms/category-selector';
import Cursors from 'cursors';
import Query from 'components/forms/query';
import React from 'react';
import Summary from 'components/forms/summary';

export default React.createClass({
  mixins: [Cursors],

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
          forms={this.props.forms}
          value={this.state.category}
          onChange={this.handleChange}
        />
        {this.transferPropsTo(<Summary />)}
      </div>
    );
  }
});

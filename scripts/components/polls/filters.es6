import Cursors from 'cursors';
import Query from 'components/shared/query';
import React from 'react';
import Summary from 'components/shared/summary';

export default React.createClass({
  mixins: [Cursors],

  handleChange: function (ev) {
    console.log(ev.target.value);
    var deltas = {};
    deltas[ev.target.name] = {$set: ev.target.value};
    this.update(deltas);
  },

  render: function () {
    return (
      <div className='osw-polls-filters'>
        <Query value={this.state.query} onChange={this.handleChange} />
        <Summary
          {...this.props}
          filterKeys={['query']}
          objects={this.props.polls}
          showMessage={false}
        />
      </div>
    );
  }
});

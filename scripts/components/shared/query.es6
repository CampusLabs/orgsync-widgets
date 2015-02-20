import Cursors from 'cursors';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  propTypes: {
    onChange: React.PropTypes.func.isRequired,
    value: React.PropTypes.string
  },

  render: function () {
    return (
      <div className='osw-big osw-field oswi oswi-magnify'>
        <input
          name='query'
          type='text'
          placeholder='Search by name or keyword'
          value={this.props.value}
          onChange={this.props.onChange}
          autoComplete='off'
        />
      </div>
    );
  }
});

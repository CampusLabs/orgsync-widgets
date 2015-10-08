import {Mixin as Cursors} from 'cursors';
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
          autoComplete='off'
          name='query'
          onChange={this.props.onChange}
          placeholder='Search by name or keyword'
          type='text'
          value={this.props.value}
        />
      </div>
    );
  }
});

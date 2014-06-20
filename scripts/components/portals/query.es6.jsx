/** @jsx React.DOM */

import React from 'react/addons';

export default React.createClass({
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

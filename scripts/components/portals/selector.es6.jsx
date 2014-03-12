/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  render: function () {
    return this.transferPropsTo(
      <div className='big field icon dropdown'>
        <select
          name={this.props.name}
          value={this.props.value}
          onChange={this.props.onChange}
        >
          {this.props.renderOptions()}
        </select>
      </div>
    );
  }
});

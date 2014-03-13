/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  render: function () {
    return this.transferPropsTo(
      <div className='osw-big osw-field oswi osw-dropdown'>
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

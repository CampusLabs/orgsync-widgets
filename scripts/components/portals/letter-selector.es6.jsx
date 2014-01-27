/** @jsx React.DOM */

import _ from 'underscore';
import React from 'react';

var letters = ['Starting with...'].concat(
  _.times(26, function (n) { return String.fromCharCode(65 + n); })
).concat('Other');

export default React.createClass({
  renderOptions: function () {
    return letters.map(function (letter) {
      return <option>{letter}</option>;
    });
  },

  render: function () {
    return (
      <div className='portals-selector letter'>
        <select
          name='letter'
          value={this.props.value}
          onChange={this.props.onChange}
        >
          {this.renderOptions()}
        </select>
      </div>
    );
  }
});

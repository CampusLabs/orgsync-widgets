/** @jsx React.DOM */

import _ from 'underscore';
import React from 'react';
import Selector from 'components/portals/selector';

var letters = ['Starting with...'].concat(
  _.times(26, function (n) { return String.fromCharCode(65 + n); })
).concat('Other');

export default React.createClass({
  renderOptions: function () {
    return letters.map(function (letter) {
      return <option key={letter}>{letter}</option>;
    });
  },

  render: function () {
    return this.transferPropsTo(
      <Selector name='letter' renderOptions={this.renderOptions} />
    );
  }
});

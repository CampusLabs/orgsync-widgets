/** @jsx React.DOM */

import _ from 'underscore';
import React from 'react';
import Selector from 'components/portals/selector';

var letters = [{value: '', displayName: 'Starting with...'}].concat(
  _.times(26, function (n) {
    var letter = String.fromCharCode(65 + n);
    return {value: letter, displayName: letter};
  })
).concat({value: 'Other', displayName: 'Other'});

export default React.createClass({
  renderOptions: function () {
    return letters.map(function (letter) {
      return (
        <option key={letter.value} value={letter.value}>
          {letter.displayName}
        </option>
      );
    });
  },

  render: function () {
    return this.transferPropsTo(
      <Selector name='letter' renderOptions={this.renderOptions} />
    );
  }
});

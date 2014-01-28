/** @jsx React.DOM */

import _ from 'underscore';
import React from 'react';
import Selector from 'components/portals/selector';

export default React.createClass({
  letters: [{value: '', displayName: 'Starting with...'}].concat(
    _.times(26, function (n) {
      var letter = String.fromCharCode(65 + n);
      return {value: letter, displayName: letter};
    })
  ).concat({value: 'Other', displayName: 'Other'}),

  renderOptions: function () {
    return this.letters.map(function (letter) {
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

/** @jsx React.DOM */

import _ from 'underscore';
import LetterColumn from 'components/portals/letter-column';
import React from 'react';

export default React.createClass({
  renderColumn: function (letter, i) {
    return this.transferPropsTo(
      <LetterColumn
        key={i}
        letter={letter}
        selected={this.props.value === letter}
      />
    );
  },

  renderColumns: function () {
    var fromCode = function (n) { return String.fromCharCode(n); };
    var letters = _.map(_.range(65, 91), fromCode);
    return _.map([''].concat(letters, 'Other'), this.renderColumn);
  },

  render: function () {
    return (
      <table className='letter-selector'>
        <tbody>
          <tr>
            {this.renderColumns()}
          </tr>
        </tbody>
      </table>
    );
  }
});

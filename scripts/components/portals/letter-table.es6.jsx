/** @jsx React.DOM */

import _ from 'underscore';
import LetterCell from 'components/portals/letter-cell';
import React from 'react/addons';

export default React.createClass({
  renderCell: function (letter, i) {
    return this.transferPropsTo(
      <LetterCell
        key={i}
        letter={letter}
        selected={this.props.value === letter}
      />
    );
  },

  renderCells: function () {
    var fromCode = function (n) { return String.fromCharCode(n); };
    var letters = _.map(_.range(65, 91), fromCode);
    return _.map([''].concat(letters, 'Other'), this.renderCell);
  },

  render: function () {
    return (
      <table className='osw-portals-letter-table'>
        <tbody>
          <tr>
            {this.renderCells()}
          </tr>
        </tbody>
      </table>
    );
  }
});

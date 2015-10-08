import _ from 'underscore';
import {Mixin} from 'cursors';
import LetterCell from 'components/portals/letter-cell';
import React from 'react';

export default React.createClass({
  mixins: [Mixin],

  renderCell: function (letter, i) {
    return (
      <LetterCell
        {...this.props}
        key={i}
        letter={letter}
        cursors={{currentLetter: this.getCursor('letter')}}
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

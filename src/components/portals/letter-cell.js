import Button from '../ui/button';
import Cursors from 'cursors';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getClassName: function () {
    if (this.state.currentLetter === this.props.letter) {
      return 'osw-button-selected';
    }
  },

  handleClick: function () {
    this.update({currentLetter: {$set: this.props.letter}});
  },

  render: function () {
    return (
      <td className='osw-portals-letter-cell'>
        <Button className={this.getClassName()} onClick={this.handleClick}>
          {this.props.letter || 'All'}
        </Button>
      </td>
    );
  }
});

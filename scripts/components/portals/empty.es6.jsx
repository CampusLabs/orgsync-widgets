/** @jsx React.DOM */

import Cursors from 'cursors';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  handleClick: function () {
    this.update({
      umbrella: {$set: ''},
      category: {$set: ''},
      letter: {$set: ''},
      query: {$set: ''}
    });
  },

  render: function () {
    return (
      <div className='osw-portals-empty osw-inset-block'>
        <div className='osw-portals-empty-apology'>
          We're sorry, but no portals match your selected filters.
        </div>
        <div className='osw-portals-empty-suggestions-header'>Suggestions</div>
        <ul>
          <li>Make sure all words are spelled correctly</li>
          <li>Try different, or fewer, keywords</li>
          <li>Clear all filters to return to all organizations</li>
        </ul>
        <input
          type='button'
          className='osw-button'
          value='Clear All Filters'
          onClick={this.handleClick}
        />
      </div>
    );
  }
});

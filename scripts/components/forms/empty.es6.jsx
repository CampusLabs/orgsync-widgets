/** @jsx React.DOM */

import Button from 'components/button';
import Cursors from 'cursors';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  handleClick: function () {
    this.update({
      category: {$set: ''},
      query: {$set: ''}
    });
  },

  render: function () {
    return (
      <div className='osw-portals-empty osw-inset-block'>
        <div className='osw-portals-empty-apology'>
          We're sorry, but no forms match your selected filters.
        </div>
        <div className='osw-portals-empty-suggestions-header'>Suggestions</div>
        <ul className='osw-portals-empty-suggestions'>
          <li>Make sure all words are spelled correctly</li>
          <li>Try different, or fewer, keywords</li>
          <li>Clear all filters to return to all organizations</li>
        </ul>
        <Button onClick={this.handleClick}>Clear All Filters</Button>
      </div>
    );
  }
});

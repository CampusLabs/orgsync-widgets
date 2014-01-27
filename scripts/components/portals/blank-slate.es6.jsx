/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  render: function () {
    return (
      <div className='portals-blank-slate'>
        <div className='apology'>
          We're sorry, but no portals match your selected filters.
        </div>
        <div className='suggestions-header'>Suggestions</div>
        <ul>
          <li>Make sure all words are spelled correctly</li>
          <li>Try different, or fewer, keywords</li>
          <li>Clear all filters to return to all organizations</li>
        </ul>
        <input
          type='button'
          className='button'
          value='Clear All Filters'
          onClick={this.props.onClick}
        />
      </div>
    );
  }
});

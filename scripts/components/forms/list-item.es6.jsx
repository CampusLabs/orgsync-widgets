/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  render: function () {
    return (
      <div className='osw-forms-list-item'>
        {this.props.form.name}
      </div>
    );
  }
});

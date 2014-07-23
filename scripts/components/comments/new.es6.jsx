/** @jsx React.DOM */

import Button from 'components/button';
import React from 'react';

export default React.createClass({
  render: function () {
    return (
      <div className='osw-comments-new'>
        <Button href={this.props.url}>Comment on OrgSync!</Button>
      </div>
    );
  }
});

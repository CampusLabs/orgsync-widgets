import React from 'react';

export default React.createClass({
  propTypes: {
    message: React.PropTypes.string.isRequired
  },

  render: function() {
    return (
      <div className='osw-inset-block osw-inset-block-red'>
        {this.props.message}
      </div>
    );
  }
});

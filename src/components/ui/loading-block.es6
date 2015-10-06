import React from 'react';

export default React.createClass({
  propTypes: {
    message: React.PropTypes.string
  },

  getDefaultProps: function() {
    return {
      message: 'Loading...'
    };
  },

  render: function() {
    return (
      <div className='osw-inset-block'>
        {this.props.message}
      </div>
    );
  }
});

import Button from 'components/ui/button';
import React from 'react';

export default React.createClass({
  propTypes: {
    to: React.PropTypes.string.isRequired,
    subject: React.PropTypes.string,
    body: React.PropTypes.string
  },

  getDefaultProps: function() {
    return {
      subject: '',
      body: ''
    };
  },

  render: function() {
    return(
      <a href={`mailto:${this.props.to}?subject=${this.props.subject}&body=${this.props.body}`}>Contact Us</a>
    );
  }
});

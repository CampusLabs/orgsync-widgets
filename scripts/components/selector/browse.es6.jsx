/** @jsx React.DOM */

import React from 'react';
module SelectorInput from 'components/selector/input';

export default React.createClass({
  render: function () {
    return this.transferPropsTo(SelectorInput.default());
  }
});

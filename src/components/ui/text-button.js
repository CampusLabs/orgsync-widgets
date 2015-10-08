import Button from 'components/ui/button';
import {Mixin} from 'cursors';
import React from 'react';

export default React.createClass({
  mixins: [Mixin],

  render: function () {
    return <Button {...this.props} baseClassName='osw-text-button' />;
  }
});

import Cursors from 'cursors';
import joinClassNames from '../../utils/join-class-names';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  render: function () {
    return (
      <div
        {...this.props}
        className={joinClassNames('osw-button-group', this.props.className)}
      >
        {this.props.children}
      </div>
    );
  }
});

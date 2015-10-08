import {Mixin} from 'cursors';
import joinClassNames from 'utils/join-class-names';
import React from 'react';

export default React.createClass({
  mixins: [Mixin],

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

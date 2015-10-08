import {Mixin as Cursors} from 'cursors';
import joinClassNames from 'utils/join-class-names';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  render: function () {
    return (
      <i
        {...this.props}
        className={
          joinClassNames('oswi oswi-' + this.props.name, this.props.className)
        }
      />
    );
  }
});

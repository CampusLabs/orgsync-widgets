import Cursors from 'cursors';
import React from 'react';
import TextButton from 'components/ui/text-button';

export default React.createClass({
  mixins: [Cursors],

  goToFile: function () {
    this.update({
      direction: {$set: 'back'},
      currentFile: {$set: this.props.file}
    });
  },

  render: function () {
    var file = this.props.file;
    return (
      <span>
        {file.id ? ' > ' : ''}
        <TextButton onClick={this.goToFile}>{file.name}</TextButton>
      </span>
    );
  }
});

// https://github.com/orgsync/orgsync/pull/6129#issuecomment-52841135

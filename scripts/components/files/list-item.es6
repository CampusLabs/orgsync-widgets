import Cursors from 'cursors';
import File from 'entities/file';
import moment from 'moment';
import React from 'react';
import Sep from 'components/ui/sep';
import TextButton from 'components/ui/text-button';

const FORMAT = 'MMM D, YYYY, h:mm A';

export default React.createClass({
  mixins: [Cursors],

  goToFile: function () {
    this.update({
      direction: {$set: 'forward'},
      currentFile: {$set: this.state.file}
    });
  },

  renderPin: function () {
    let classes = ['osw-files-list-item-pin'];
    if (!this.state.file.is_pinned) {
      classes.push('osw-files-list-item-pin-hidden');
    }
    return <div className={classes.join(' ')} />
  },

  renderCount: function () {
    return (
      <TextButton onClick={this.goToFile}>
        {this.state.file.file_count}
      </TextButton>
    );
  },

  renderDownload: function () {
    return (
      <TextButton href={this.state.file.links.download}>Download</TextButton>
    );
  },

  render: function () {
    let file = this.state.file;
    return (
      <div className='osw-files-list-item'>
        <pre>{JSON.stringify(file, null, 2)}</pre>
        {this.renderPin()}
        <img src={File.getPictureUrl(file)} onClick={this.goToFile} />
        <div onClick={this.goToFile}>{file.name}</div>
        <div>
          <span>{moment(file.updated_at).format(FORMAT)}</span>
          <Sep />
          {file.type === 'folder' ? this.renderCount() : this.renderDownload()}
        </div>
      </div>
    );
  }
});

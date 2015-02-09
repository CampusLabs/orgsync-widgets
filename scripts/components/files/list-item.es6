import Cursors from 'cursors';
import {getPictureUrl} from 'entities/file';
import moment from 'moment';
import React from 'react';
import Sep from 'components/ui/sep';
import TextButton from 'components/ui/text-button';

const FORMAT = 'MMM D, YYYY, h:mm A';

export default React.createClass({
  mixins: [Cursors],

  pushPath: function () {
    this.update({path: {$push: [this.state.file]}});
  },

  stopPropagation: function (ev) {
    ev.stopPropagation();
  },

  renderPin: function () {
    let classes = ['osw-files-list-item-pin'];
    if (!this.state.file.is_pinned) {
      classes.push('osw-files-list-item-pin-hidden');
    }
    return <div className={classes.join(' ')} />
  },

  renderCount: function () {
    return `${this.state.file.file_count || 'No'} Items`;
  },

  renderDownload: function () {
    return (
      <TextButton
        className='osw-files-list-item-download'
        href={this.state.file.links.download}
        onClick={this.stopPropagation}
      >
        Download
      </TextButton>
    );
  },

  render: function () {
    let file = this.state.file;
    return (
      <div className='osw-files-list-item' onClick={this.pushPath}>
        <div className='osw-files-list-item-left'>
          {this.renderPin()}
          <div
            className='osw-files-list-item-picture'
            style={{backgroundImage: `url('${getPictureUrl(file)}')`}}
          />
        </div>
        <div className='osw-files-list-item-info'>
          <div className='osw-files-list-item-name'>{file.name}</div>
          <div className='osw-files-list-item-date'>
            <span>{moment(file.updated_at).format(FORMAT)}</span>
            <Sep />
            {
              file.type === 'folder' ?
              this.renderCount() :
              this.renderDownload()
            }
          </div>
        </div>
      </div>
    );
  }
});

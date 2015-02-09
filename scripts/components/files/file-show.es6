import api from 'api';
import Button from 'components/ui/button';
import CommentsIndex from 'components/comments/index';
import Cursors from 'cursors';
import moment from 'moment';
import React from 'react';
import {getPictureUrl, getHumanFileSize} from 'entities/file';

const FORMAT = 'MMM D, YYYY, h:mm A';

export default React.createClass({
  mixins: [Cursors],

  componentWillMount: function () {
    this.fetch();
  },

  fetch: function () {
    api.get(this.state.file.links.show, this.handleFetch);
  },

  handleFetch: function (er, res) {
    this.update({file: {$merge: er ? {} : res.data}});
  },

  renderDetail: function (label, key, isDate) {
    let val = this.state.file[key];
    if (!val) return;
    if (isDate) val = moment(val).format(FORMAT);
    return (
      <div className='osw-files-file-show-detail'>
        <strong>{`${label}:`}</strong>{` ${val}`}
      </div>
    )
  },

  renderDescription: function () {
    let description = this.state.file.description;
    if (!description) return;
    return (
      <div className='osw-files-file-show-description'>
        {description}
      </div>
    );
  },

  render: function () {
    let file = this.state.file;
    return (
      <div className='osw-files-file-show'>
        <div className='osw-files-file-show-info'>
          <div
            className='osw-files-file-show-picture'
            style={{backgroundImage: `url('${getPictureUrl(file)}')`}}
          />
          <div className='osw-files-file-show-name'>{file.name}</div>
          {this.renderDetail('Filename', 'file_name')}
          {this.renderDetail('Created', 'created_at', true)}
          {this.renderDetail('Updated', 'updated_at', true)}
          <Button
            className='osw-files-file-show-download'
            href={file.links.download}
          >
            Download {getHumanFileSize(file)}
          </Button>
        </div>
        {this.renderDescription()}
        <CommentsIndex
          url={file.links.comments}
          newUrl={file.links.web}
          cursors={{comments: this.getCursor('file', 'comments')}}
        />
      </div>
    );
  }
});

import _ from 'underscore';
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
    this.update({isLoading: {$set: true}, error: {$set: null}});
    api.get(this.state.file.links.show, this.handleFetch);
  },

  handleFetch: function (er, res) {
    this.update({
      isLoading: {$set: false},
      error: {$set: er},
      file: {$merge: er ? {} : res.data}
    });
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

  renderFile: function () {
    let file = this.state.file;
    return (
      <div className='osw-files-file-show'>
        <div className='osw-files-file-show-info'>
          <div
            className='osw-files-file-show-picture'
            style={{backgroundImage: `url('${getPictureUrl(file)}')`}}
          />
          <div className='osw-files-file-show-name'>{file.name}</div>
          <div className='osw-files-file-show-date'>
            <strong>Filename:</strong> {file.file_name}
          </div>
          <div className='osw-files-file-show-date'>
            <strong>Created:</strong> {moment(file.created_at).format(FORMAT)}
          </div>
          <div className='osw-files-file-show-date'>
            <strong>Updated:</strong> {moment(file.updated_at).format(FORMAT)}
          </div>
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
  },

  render: function () {
    return (
      this.state.isLoading ? <div>Loading...</div> :
      this.state.error ? <div>{this.state.error.toString()}</div> :
      this.renderFile()
    );
  }
});

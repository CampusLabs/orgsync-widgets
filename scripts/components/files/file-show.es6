import api from 'api';
import Cursors from 'cursors';
import React from 'react';

import {getPictureUrl} from 'entities/file';

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

  renderFile: function () {
    var file = this.state.file;
    return (
      <div className='osw-files-file-show'>
        <div className='osw-files-list-item-left'>
          <div
            className='osw-files-list-item-picture'
            style={{backgroundImage: `url('${getPictureUrl(file)}')`}}
          />
        </div>
        <div className='osw-files-list-item-info'>
          <div className='osw-files-list-item-name'>{file.name}</div>
          <div className='osw-files-list-item-date'>
            {file.updated_at}
          </div>
        </div>
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

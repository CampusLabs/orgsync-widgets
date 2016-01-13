import _ from 'underscore';
import api from '../../utils/api';
import Cursors from 'cursors';
import FetchList from '../ui/fetch-list';
import FilesListItem from '../files/list-item';
import React from 'react';

var PER_PAGE = 100;

export default React.createClass({
  mixins: [Cursors],

  getFiles: function () {
    return this.state.file.files || [];
  },

  fetch: function (cb) {
    var folder = this.state.file;
    var path = '/portals/:portal_id/files';
    if (folder.id) path += '/:id/contents';
    api.get(path, _.extend({
      portal_id: folder.portal.id,
      id: folder.id || void 0,
      page: Math.floor(this.getFiles().length / PER_PAGE) + 1,
      per_page: PER_PAGE
    }), _.partial(this.handleFetch, cb));
  },

  handleFetch: function (cb, er, res) {
    if (er) return cb(er);
    var files = _.chain(this.getFiles().concat(res.data))
      .unique('id')
      .map(file =>
        _.extend({}, file, {
          portal: this.state.file.portal,
          comments: [],
          versions: []
        })
      )
      .value();
    this.update({file: {files: {$set: files}}});
    cb(null, res.data.length < PER_PAGE);
  },

  renderListItem: function (file) {
    var i = this.getFiles().indexOf(file);
    return (
      <FilesListItem
        key={file.id}
        cursors={{
          path: this.getCursor('path'),
          file: this.getCursor('file', ['files', i])
        }}
      />
    );
  },

  render: function () {
    return (
      <FetchList
        className='osw-files-folder-show'
        fetch={this.fetch}
        itemRenderer={this.renderListItem}
        items={this.getFiles()}
        type='uniform'
      />
    );
  }
});

import _ from 'underscore';
import api from 'api';
import Cursors from 'cursors';
import List from 'react-list';
import FilesListItem from 'components/files/list-item';
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
    var parent = this.state.file;
    var files = _.chain(this.getFiles().concat(res.data))
      .unique('id')
      .map(function (file) {
        return _.extend({}, file, {parent: parent, portal: parent.portal});
      })
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
          direction: this.getCursor('direction'),
          currentFile: this.getCursor('file'),
          file: this.getCursor('file', ['files', i])
        }}
      />
    );
  },

  render: function () {
    return (
      <List
        className='osw-files-folder-show'
        items={this.getFiles()}
        renderItem={this.renderListItem}
        fetch={this.fetch}
        uniform={true}
      />
    );
  }
});

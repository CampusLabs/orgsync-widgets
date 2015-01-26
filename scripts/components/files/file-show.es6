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
    return this.state.folder.files || [];
  },

  fetch: function (cb) {
    var id = this.state.folder.id;
    var path = '/portals/:portal_id/files';
    if (id) path += '/:id/contents';
    api.get('/portals/:portal_id/files', {
      portal_id: this.props.portalId,
      id: id,
      page: Math.floor(this.getFiles().length / PER_PAGE) + 1,
      per_page: PER_PAGE
    }, _.partial(this.handleFetch, cb));
  },

  handleFetch: function (cb, er, res) {
    if (er) return cb(er);
    var parent = this.state.file;
    var files = _.chain(this.getFiles().concat(res.data))
      .unique('id')
      .map(function (file) { return _.extend({}, file, {parent: parent}); })
      .value();
    this.update({folder: {files: {$set: files}}});
    cb(null, res.data.length < PER_PAGE);
  },

  renderListItem: function (file) {
    var i = this.getFiles().indexOf(file);
    return (
      <FilesListItem
        key={file.id}
        cursors={{
          direction: this.getCursor('direction'),
          file: this.getCursor('folder', ['files', i])
        }}
      />
    );
  },

  render: function () {
    return (
      <div>{this.state.file.name}</div>
    );
  }
});

// https://github.com/orgsync/orgsync/pull/6129#issuecomment-52841135

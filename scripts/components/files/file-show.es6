import _ from 'underscore';
import api from 'api';
import Cursors from 'cursors';
import List from 'react-list';
import FilesListItem from 'components/files/list-item';
import React from 'react';

var PER_PAGE = 100;

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

  render: function () {
    return (
      this.state.isLoading ? <div>Loading...</div> :
      this.state.error ? <div>{this.state.error.toString()}</div> :
      <pre>{JSON.stringify(this.state.file, null, 2)}</pre>
    );
  }
});

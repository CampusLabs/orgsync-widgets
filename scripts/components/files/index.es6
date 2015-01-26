import _ from 'underscore';
import Breadcrumb from 'components/files/breadcrumb';
import Cursors from 'cursors';
import FileShow from 'components/files/file-show';
import FolderShow from 'components/files/folder-show';
import React from 'react';

let CSSTransitionGroup = React.addons.CSSTransitionGroup;

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      direction: 'forward',
      currentFile: {
        id: 0,
        type: 'folder',
        name: 'Files',
        portal: {
          id: this.props.portalId
        }
      }
    };
  },

  renderBreadCrumb: function (file) {
    return (
      <Breadcrumb
        key={file.id}
        file={file}
        cursors={{
          direction: this.getCursor('direction'),
          currentFile: this.getCursor('currentFile')
        }}
      />
    );
  },

  renderBreadCrumbs: function () {
    var files = [];
    var file = this.state.currentFile;
    while (file) {
      files = [file].concat(files);
      file = file.parent;
    }
    return _.map(files, this.renderBreadCrumb);
  },

  render: function () {
    var file = this.state.currentFile;
    var Show = file.type === 'folder' ? FolderShow : FileShow;
    return (
      <div className='osw-files-index'>
        {this.renderBreadCrumbs()}
        <CSSTransitionGroup
          transitionName={'osw-slide-' + this.state.direction}
        >
          <Show
            key={file.id}
            cursors={{
              direction: this.getCursor('direction'),
              file: this.getCursor('currentFile')
            }}
          />
        </CSSTransitionGroup>
      </div>
    );
  }
});

// https://github.com/orgsync/orgsync/pull/6129#issuecomment-52841135

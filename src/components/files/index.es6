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
      root: {
        files: [{
          id: 0,
          type: 'folder',
          name: 'Files',
          portal: {
            id: this.props.portalId
          }
        }]
      },
      path: [0]
    };
  },

  componentWillMount: function () {
    this.lastPathLength = 0;
  },

  componentDidUpdate: function (__, prevState) {
    if (this.state.path !== prevState.path) {
      window.scrollTo(0, this.getDOMNode().offsetTop);
      this.lastPathLength = this.state.path.length;
    }
  },

  getDirection: function () {
    return this.state.path.length < this.lastPathLength ? 'back' : 'forward';
  },

  renderBreadCrumb: function (file) {
    return (
      <Breadcrumb
        key={file.id}
        file={file}
        cursors={{path: this.getCursor('path')}}
      />
    );
  },

  getFile: function () {
    return _.reduce(
      this.state.path,
      (file, id) => _.find(file.files, {id: id}),
      this.state.root
    );
  },

  getCursorPath: function () {
    let file = this.state.root;
    return _.reduce(this.state.path, (path, id) => {
      let files = file.files;
      file = _.find(files, {id: id});
      return path.concat('files', _.indexOf(files, file));
    }, []);
  },

  renderBreadCrumbs: function () {
    let file = this.state.root;
    return _.map(
      this.state.path,
      id => this.renderBreadCrumb(file = _.find(file.files, {id: id}))
    );
  },

  render: function () {
    var file = this.getFile();
    var Show = file.type === 'folder' ? FolderShow : FileShow;
    return (
      <div className='osw-files-index'>
        <div className='osw-files-index-header'>
          {this.renderBreadCrumbs()}
        </div>
        <CSSTransitionGroup
          component='div'
          transitionName={'osw-files-slide-' + this.getDirection()}
          className='osw-files-index-pages'
        >
          <div key={file.id} className='osw-files-index-page'>
            <Show
              cursors={{
                file: this.getCursor('root', this.getCursorPath()),
                path: this.getCursor('path')
              }}
            />
          </div>
        </CSSTransitionGroup>
      </div>
    );
  }
});

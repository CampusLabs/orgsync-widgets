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
      path: [{
        id: 0,
        type: 'folder',
        name: 'Files',
        portal: {
          id: this.props.portalId
        }
      }]
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

  renderBreadCrumbs: function () {
    return _.map(this.state.path, this.renderBreadCrumb);
  },

  render: function () {
    var file = _.last(this.state.path);
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
            <Show cursors={{
              file: this.getCursor('path', this.state.path.length - 1),
              path: this.getCursor('path')
            }} />
          </div>
        </CSSTransitionGroup>
      </div>
    );
  }
});

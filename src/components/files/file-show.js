import _ from 'underscore';
import api from '../../utils/api';
import Button from '../ui/button';
import CommentsIndex from '../comments/index';
import Cursors from 'cursors';
import moment from 'moment';
import React from 'react';
import {getPictureUrl, getHumanFileSize} from '../../entities/file';

const FORMAT = iso => moment(iso).format('MMM D, YYYY, h:mm A');

export default React.createClass({
  mixins: [Cursors],

  componentWillMount: function () {
    this.fetch();
  },

  fetch: function () {
    api.get(this.state.file.links.show, this.handleFetch);
    api.get(this.state.file.links.versions, this.handleVersionsFetch);
  },

  handleFetch: function (er, res) {
    this.update({file: {$merge: er ? {} : res.data}});
  },

  handleVersionsFetch: function (er, res) {
    this.update({file: {versions: {$set: er ? [] : res.data}}});
  },

  renderDetail: function (label, key, isDate) {
    let val = this.state.file[key];
    if (!val) return;
    if (isDate) val = FORMAT(val);
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
      <div className='osw-files-file-show-section'>
        <div className='osw-files-file-show-header'>Description</div>
        {description}
      </div>
    );
  },

  renderVersion: function (version) {
    return [

      <tr key={version.id}>
        <td>{FORMAT(version.created_at)}</td>
        <td>{version.account.display_name}</td>
        <td>{version.file_name}</td>
        <td>
          <Button href={version.links.download}>
            {`Download ${getHumanFileSize(version.file_size)}`}
          </Button>
        </td>
      </tr>
    ].concat(
      version.description ?
      <tr
        key={`${version.id}-description`}
        className='osw-files-file-show-version-description'
      >
        <td></td>
        <td colSpan='4'>
          <strong>Version Notes</strong><br />
          {version.description}
        </td>
      </tr> : []
    );
  },

  renderVersions: function () {
    var versions = this.state.file.versions;
    if (!versions.length) return;
    return (
      <div className='osw-files-file-show-section'>
        <div className='osw-files-file-show-header'>Versions</div>
        <table className='osw-files-file-show-versions'>
          <thead>
            <tr>
              <th>Created</th>
              <th>Added by</th>
              <th>Filename</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {_.map(versions, this.renderVersion)}
          </tbody>
        </table>
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
            Download {getHumanFileSize(file.file_size)}
          </Button>
        </div>
        {this.renderDescription()}
        {this.renderVersions()}
        <div className='osw-files-file-show-section'>
          <div className='osw-files-file-show-header'>Comments</div>
          <CommentsIndex
            url={file.links.comments}
            newUrl={file.links.web}
            cursors={{comments: this.getCursor('file', 'comments')}}
          />
        </div>
      </div>
    );
  }
});

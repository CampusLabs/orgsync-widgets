import _ from 'underscore';
import _str from 'underscore.string';
import api from 'api';
import Cursors from 'cursors';
import React from 'react';

const PERSIST_KEY = 'OSW_BUILDER';

const WIDGET_OPTIONS = {
  lockView: {
    name: 'Lock the View',
    description: 'Do not allow switching between list view and 30-day' ,
    values: [
      {name: 'True', value: 'true'},
      {name: 'False', value: 'false'}
    ]},
  redirect: {
    name: 'Links point to OrgSync Web App',
    description: 'Don\'t point to a popup' ,
    values: [
      {name: 'true', value: 'true'},
      {name: 'false', value: 'false'
    }]},
  view: {
    name: 'Default View',
    description: '',
    values: [
      {name: 'calendar', value: 'calendar'},
      {name: 'upcoming', value: 'upcoming'},
      {name: 'past', value: 'past'}
    ]
  },
  isService: {
    name: 'This is a service portal',
    values: [
      {name: 'True', value: 'true'},
      {name: 'False', value: 'false'}
    ]
  },
  tz: {
    name: 'TimeZone'
  }
}

const WIDGETS = {
  Albums: {
    moduleName: 'albums/index',
    props: ['portalId']
  },
  Bookmarks: {
    moduleName: 'bookmarks/index',
    props: ['portalId']
  },
  Events: {
    moduleName: 'events/index',
    props: [
      'communityId',
      'isService',
      'portalId',
      'view',
      'lockView',
      'tz',
      'activeEventFilterIds',
      'permissions',
      'redirect',
      'rolloutNewEvents'
    ]
  },
  Files: {
    moduleName: 'files/index',
    props: [
      'portalId'
    ]
  },
  Forms: {
    moduleName: 'forms/index',
    props: [
      'portalId'
    ]
  },
  News: {
    moduleName: 'news-posts/index',
    props: [
      'portalId',
      'truncateLength',
      'redirect'
    ]
  },
  Polls: {
    moduleName: 'polls/index',
    props: [
      'portalId',
      'limit'
    ]
  },
  Portals: {
    moduleName: 'portals/index',
    props: [
      'communityId',
      'umbrella',
      'category',
      'letter',
      'filtersAreShowing',
      'redirect'
    ]
  },
  Selector: {
    moduleName: 'selector/index',
    props: [
      'allowArbitrary',
      'allowEmptyQuery',
      'allowBrowse',
      'browseText',
      'limit',
      'scopes',
      'value',
      'types',
      'boostTypes',
      'view',
      'dataset',
      'where'
    ]
  }
};

const DEFAULT_STATE = {
  widget: _.keys(WIDGETS)[0],
  props: {}
};

export default React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      devMode: false,
      modifiableProps: ['isService']
    }
  },

  getInitialState: function () {

    if (this.props.devMode) {
      let state;
      try { state = JSON.parse(localStorage.getItem(PERSIST_KEY)); }
      catch (er) {}
      return _.extend({}, state || DEFAULT_STATE, {
        apiKey: api.key
      });
    } else {
      return {
        widget: this.props.widget,
        props: this.props,
        apiKey: api.key
      }
    }
  },

  componentDidUpdate: function () {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(this.state));
    localStorage.setItem('OSW_API_KEY', api.key = this.state.apiKey);
  },

  handleApiKeyChange: function (ev) {
    this.update({apiKey: {$set: ev.target.value}});
  },

  handleWidgetChange: function (ev) {
    this.update({widget: {$set: ev.target.value}, props: {$set: {}}});
  },

  handlePropChange: function (prop, ev) {
    var deltas = {props: {}};
    deltas.props[prop] = {$set: ev.target.value || void 0};
    this.update(deltas);
  },

  renderWidgetOptions: function () {
    return _.map(WIDGETS, (__, widget) =>
      <option key={widget}>{widget}</option>
    );
  },

  renderName: function (prop){
    if (!WIDGET_OPTIONS[prop]) return prop;
    return WIDGET_OPTIONS[prop].name;
  },

  renderDescription: function (prop){
    if (!WIDGET_OPTIONS[prop]) return;
    return WIDGET_OPTIONS[prop].description;
  },

  renderInput: function (prop) {
    if (WIDGET_OPTIONS[prop] && WIDGET_OPTIONS[prop].values) {
      return this.renderWidgetOptionsSelector(prop);
    } else {
      return this.renderWidgetOptionsTextInput(prop);
    }
  },

  renderWidgetOptionsElement: function (prop) {
    return (
      <div className='osw-form-element'>
        <strong>{this.renderName(prop)}</strong><br />
        {this.renderDescription(prop)}
        {this.renderInput(prop)}
      </div>
    );
  },

  renderWidgetOptionsTextInput: function (prop) {
    return (
      <div className='osw-field'>
        <input
          value={this.state.props[prop]}
          onChange={_.partial(this.handlePropChange, prop)}
        />
      </div>
    );
  },

  renderWidgetOptionsSelector: function (prop) {
    return(
      <div className='osw-field osw-dropdown'>
        <select
          value={this.state.props[prop]}
          onChange={_.partial(this.handlePropChange, prop)}>
            {_.map(WIDGET_OPTIONS[prop].values, function(value){
              return <option key={value.value}>{value.name}</option>;
            })}
        </select>
      </div>
    );
  },

  renderProp: function (prop) {
    if(!this.props.devMode && !_.contains(this.props.modifiableProps, prop)) return;

    return (
      <div key={prop}>
        {_.contains(_.keys(WIDGET_OPTIONS), prop) ?
          this.renderWidgetOptionsElement(prop) : this.renderWidgetOptionsElement(prop)}
      </div>
    );
  },

  renderProps: function () {
    return _.map(WIDGETS[this.state.widget].props, this.renderProp);
  },

  getDataAttrs: function () {
    return _.compact(_.map(_.extend({
      moduleName: WIDGETS[this.state.widget].moduleName
    }, this.state.props), (val, key) => {
      if (!val) return;
      var stringified = JSON.stringify(val).replace(/\\(.)/g, '$1');
      if (_.isString(val)) stringified = stringified.slice(1, -1);
      return `data-${_str.dasherize(key)}='${_.escape(stringified)}'`;
    }));
  },

  renderHtml: function () {
    return (
      <pre className='osw-inset-block'>{`
<link href='https://orgsync.com/assets/orgsync-widgets.css' rel='stylesheet'>
<script>window.OSW_API_KEY = '${api.key}';</script>
<script src='https://orgsync.com/assets/orgsync-widgets.js' async></script>
<div
  class='orgsync-widget'
  ${this.getDataAttrs().join('\n  ')}
></div>
`}
      </pre>
    );
  },

  renderPreview: function () {
    var moduleName = `components/${WIDGETS[this.state.widget].moduleName}`;
    var Component = require(moduleName);
    var props = _.reduce(this.state.props, function (props, val, key) {
      try { val = JSON.parse(val); } catch (er) {}
      props[key] = val;
      return props;
    }, {});
    var key = JSON.stringify(props);
    return <Component key={key} {...props} />;
  },

  renderApiKey: function () {
    if (!this.props.devMode) return;

    return (
      <div className='osw-form-element'>
        API Key<br />
        <div className='osw-field'>
          <input
            value={this.state.apiKey}
            onChange={this.handleApiKeyChange}
          />
        </div>
      </div>
    );
  },

  renderWidgetSelector: function () {
    if (!this.props.devMode) return;

    return (
      <div className='osw-form-element osw-field osw-dropdown'>
        <select
          value={this.state.widget}
          onChange={this.handleWidgetChange}
        >
          {this.renderWidgetOptions()}
        </select>
      </div>
    );
  },

  render: function () {
    return (
      <div className='osw-builder-index'>
        <div className='osw-builder-index-left'>
          {this.renderApiKey()}
          {this.renderWidgetSelector()}
          {this.renderProps()}
          {this.renderHtml()}
        </div>
        <div className='osw-builder-index-right orgsync-widget'>
          {this.renderPreview()}
        </div>
      </div>
    );
  }
});

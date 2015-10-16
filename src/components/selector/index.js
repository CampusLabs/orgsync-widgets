import _ from 'underscore';
import * as app from 'orgsync-widgets';
import Button from 'components/ui/button';
import Cursors from 'cursors';
import FetchList from 'components/ui/fetch-list';
import Popup from 'components/ui/popup';
import React from 'react';
import Result from 'components/selector/result';
import Scope from 'components/selector/scope';
import * as store from 'entities/selector/store';
import Token from 'components/selector/token';
import {getBasicFields, getDisplayName, getTerm} from 'entities/selector/item';

var DOWNCASE = function (str) { return str.toLowerCase(); };

var NAME_COMPARATOR = _.compose(DOWNCASE, getDisplayName);

var SelectorIndex = React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      allowArbitrary: false,
      allowBrowse: true,
      allowEmptyQuery: true,
      browseText: 'Browse',
      dataset: null,
      fields: ['name'],
      hiddenInputName: 'selection',
      types: [],
      limit: Infinity,
      placeholder: 'Search...',
      query: '',
      renderPageSize: 50,
      scopes: [{name: 'Everything'}],
      search: store.search,
      value: [],
      view: 'inline'
    };
  },

  getInitialState: function () {
    return {
      activeIndex: 0,
      browseIsOpen: false,
      hasFocus: false,
      hasMouse: false,
      query: this.props.query,
      results: [],
      scope: this.props.scopes[0],
      value: _.sortBy(this.props.value, NAME_COMPARATOR)
    };
  },

  componentWillMount: function () {
    document.addEventListener('mousemove', this.updateLastMouse);
  },

  componentDidMount: function () {
    this.updateResults();
    if (this.state.browseIsOpen) this.query.focus();
  },

  componentDidUpdate: function (__, prev) {
    if (this.state.scope !== prev.scope || this.state.query !== prev.query) {
      this.updateResults();
    }
    if (this.isActive(prev) && !this.isActive()) this.resetActiveIndex();
  },

  componentWillUnmount: function () {
    document.removeEventListener('mousemove', this.updateLastMouse);
  },

  updateLastMouse: function (ev) {
    this.lastMouse = _.pick(ev, 'screenX', 'screenY');
  },

  mouseMoved: function (ev) {
    return !_.isEqual(this.lastMouse, _.pick(ev, 'screenX', 'screenY'));
  },

  updateResults: function () {
    var results = this.props.search(this.getSearchOptions());
    var q = store.parse(this.state.query);
    if (this.props.allowArbitrary && q) {
      results = [{name: this.state.query}].concat(results);
    }
    if (this.props.view === 'inline' && !q) {
      results = _.filter(this.props.scopes, 'selectable').concat(results);
    }
    this.update({results: {$set: results}});

    // Only reset the active index if the results at or before the current
    // active index were changed. This improves the UX by only forcing the
    // user's selection to change when it's necessary.
    var end = this.state.activeIndex + 1;
    if (!_.isEqual(results.slice(0, end), this.state.results.slice(0, end))) {
      this.resetActiveIndex(results);
    }
  },

  resetActiveIndex: function (results) {
    if (!results) results = this.state.results;
    this.update({activeIndex: {$set: this.restrictIndex(results)}});
  },

  handleScopeClick: function (scope) {
    if (scope !== this.state.scope) this.update({scope: {$set: scope}});
  },

  handleQueryChange: function (ev) {
    ev.stopPropagation();
    this.update({query: {$set: ev.target.value}});
  },

  handleKeyDown: function (ev) {
    ev.stopPropagation();
    var query = this.state.query;
    var key = ev.key;
    if (ev.ctrlKey) {
      if (ev.which === 80) key = 'ArrowUp';
      if (ev.which === 78) key = 'ArrowDown';
    }
    switch (key) {
    case 'Enter':
      var activeItem = this.state.results[this.state.activeIndex];
      if (activeItem) {
        this.handleResultClick(activeItem);
        this.update({query: {$set: ''}});
      }
      return ev.preventDefault();
    case 'Escape':
      if (query) {
        this.update({query: {$set: ''}});
      } else {
        this.query.blur();
        this.update({hasFocus: {$set: false}, hasMouse: {$set: false}});
      }
      return ev.preventDefault();
    case 'ArrowUp':
      this.incrActiveIndex(-1);
      return ev.preventDefault();
    case 'ArrowDown':
      this.incrActiveIndex(1);
      return ev.preventDefault();
    }
  },

  handleFocus: function (ev) {
    ev.stopPropagation();
    this.update({hasFocus: {$set: true}});
  },

  handleBlur: function (ev) {
    ev.stopPropagation();
    this.update({hasFocus: {$set: false}});
  },

  handleMouseOver: function (ev) {
    ev.stopPropagation();
    if (this.state.hasFocus) this.update({hasMouse: {$set: true}});
  },

  handleMouseLeave: function (ev) {
    ev.stopPropagation();
    this.update({hasMouse: {$set: false}});
  },

  isActive: function (state) {
    if (!state) state = this.state;
    return state.hasFocus || state.hasMouse;
  },

  addValue: function (item) {
    if (this.isSelected(item)) return;
    var value = _.sortBy(this.state.value.concat(item), NAME_COMPARATOR);
    this.update({value: {$set: value}});
  },

  removeValue: function (item) {
    var existing = this.getSelected(item);
    if (!existing) return;
    var i = _.indexOf(this.state.value, existing);
    this.update({value: {$splice: [[i, 1]]}});
  },

  incrActiveIndex: function (dir) {
    this.setActiveIndex(this.state.activeIndex + dir);
  },

  restrictIndex: function (results, i) {
    if (i == null) {
      i = this.props.allowArbitrary && this.state.query.trim() ? 1 : 0;
    }
    return Math.max(0, Math.min(i, results.length - 1));
  },

  setActiveIndex: function (i) {
    i = this.restrictIndex(this.state.results, i);
    this.update({activeIndex: {$set: i}});
    if (this.isMounted()) this.results.list.scrollAround(i);
  },

  getClassName: function () {
    var classes = [
      'osw-selector-index',
      'osw-selector-index-' + this.props.view
    ];
    if (this.isActive()) classes.push('osw-selector-index-active');
    if (this.shouldShowResults()) {
      classes.push('osw-selector-index-results-visible');
    }
    return classes.join(' ');
  },

  handleResultMouseOver: function (item, ev) {
    if (!this.mouseMoved(ev)) return;
    this.setActiveIndex(_.indexOf(this.state.results, item));
  },

  handleResultClick: function (item) {
    this.isSelected(item) ? this.removeValue(item) : this.addValue(item);
    this.setActiveIndex(_.indexOf(this.state.results, item));
  },

  handleBrowseButtonClick: function (ev) {
    ev.stopPropagation();
    this.openBrowse();
  },

  openBrowse: function () {
    this.update({
      hasFocus: {$set: false},
      hasMouse: {$set: false},
      browseIsOpen: {$set: true}
    });
  },

  closeBrowse: function () {
    this.update({browseIsOpen: {$set: false}});
  },

  pluckSearchOptionsFrom: function (obj) {
    var options =
      _.pick(obj, 'fields', 'limit', 'types', 'dataset', 'scopes', 'where');
    if (obj.unionScopes != null) options.union_scopes = obj.unionScopes;
    if (obj.boostTypes) options.boost_types = obj.boostTypes;
    return options;
  },

  getSearchOptions: function () {
    var options = this.pluckSearchOptionsFrom(this.props);
    if (this.state.query) options.q = this.state.query;
    if (this.props.view === 'inline') {
      options.scopes = this.props.scopes;
      options.union_scopes = true;
    } else {
      var scope = this.state.scope;
      options.scopes = [scope];
      _.extend(options, this.pluckSearchOptionsFrom(scope));
    }
    return options;
  },

  fetch: function (cb) {
    store.fetch(this.getSearchOptions(), _.partial(this.handleFetch, cb));
  },

  handleFetch: function (cb, er, done) {
    if (er) return cb(er);
    cb(null, done);
    this.updateResults();
  },

  shouldShowResults: function () {
    return this.props.view === 'browse' || (
      this.isActive() && (this.state.query.trim() || this.props.allowEmptyQuery)
    );
  },

  getSelected: function (item) {
    return _.find(
      this.state.value,
      _.compose(_.partial(_.isEqual, getTerm(item)), getTerm)
    );
  },

  isSelected: function (item) {
    return !!this.getSelected(item);
  },

  renderToken: function (item, i) {
    return (
      <Token
        key={i}
        item={item}
        onRemoveClick={_.partial(this.removeValue, item)}
      />
    );
  },

  renderTokens: function () {
    if (this.props.view === 'browse') return;
    return (
      <div className='osw-selector-index-tokens'>
        {this.state.value.map(this.renderToken)}
      </div>
    );
  },

  renderBrowseButton: function () {
    if (this.props.view === 'browse' || !this.props.allowBrowse) return;
    return (
      <Button
        className='osw-selector-index-browse-button'
        onClick={this.handleBrowseButtonClick}
      >
        {this.props.browseText}
      </Button>
    );
  },

  renderScope: function (scope, i) {
    return (
      <Scope
        isActive={scope === this.state.scope}
        isSelected={this.isSelected(scope)}
        key={i}
        onClick={_.partial(this.handleScopeClick, scope)}
        onResultClick={this.handleResultClick}
        scope={scope}
      />
    );
  },

  renderResult: function (item, i) {
    return (
      <Result
        key={i}
        item={item}
        onClick={_.partial(this.handleResultClick, item)}
        onMouseOver={_.partial(this.handleResultMouseOver, item)}
        isSelected={this.isSelected(item)}
        isActive={
          _.indexOf(this.state.results, item) === this.state.activeIndex
        }
      />
    );
  },

  renderSelectedResult: function (item, i) {
    return (
      <Result
        key={i}
        item={item}
        onClick={_.partial(this.removeValue, item)}
      />
    );
  },

  renderLoading: function () {
    return <div className='osw-selector-index-loading'>Loading...</div>;
  },

  renderEmpty: function () {
    return <div className='osw-selector-index-empty'>No results found.</div>;
  },

  renderSelectedEmpty: function () {
    return <div className='osw-selector-index-empty'>Nothing selected.</div>;
  },

  renderError: function () {
    return <div className='osw-selector-index-error'>An error occurred.</div>;
  },

  renderResults: function () {
    if (!this.shouldShowResults()) return;
    var options = this.getSearchOptions();
    return (
      <FetchList
        key={store.getQueryKey(_.omit(options, 'dataset'))}
        ref={c => this.results = c}
        className='osw-selector-index-results'
        items={this.state.results}
        itemRenderer={this.renderResult}
        loadingRenderer={this.renderLoading}
        emptyRenderer={this.renderEmpty}
        errorRenderer={this.renderError}
        fetch={this.fetch}
        type='uniform'
        renderPageSize={this.props.renderPageSize}
        updateForActiveIndex={this.state.activeIndex}
        updateForValue={this.state.value}
      />
    );
  },

  renderPopup: function () {
    if (this.props.view === 'browse' || !this.state.browseIsOpen) return;
    return (
      <Popup
        ref='popup'
        title={this.props.browseText}
        name='selector-index'
        close={this.closeBrowse}
      >
        <SelectorIndex
          {...this.props}
          view='browse'
          query={this.state.query}
          cursors={{
            value: this.getCursor('value'),
            browseIsOpen: this.getCursor('browseIsOpen')
          }}
        />
        <div className='osw-selector-index-done-container'>
          <Button onClick={this.closeBrowse}>Done</Button>
        </div>
      </Popup>
    );
  },

  renderLeft: function () {
    if (this.props.view === 'inline') return;
    return (
      <div className='osw-selector-index-left'>
        <FetchList
          className='osw-selector-index-scopes'
          itemRenderer={this.renderScope}
          items={this.props.scopes}
          type='uniform'
          updateForScope={this.state.scope}
          updateForValue={this.state.value}
        />
      </div>
    );
  },

  renderMiddle: function () {
    return (
      <div className='osw-selector-index-middle'>
        <input
          name={this.props.hiddenInputName}
          type='hidden'
          value={JSON.stringify(_.map(this.state.value, getBasicFields))}
        />
        <div className='osw-selector-index-tokens-and-query'>
          {this.renderTokens()}
          {this.renderBrowseButton()}
          <div className='osw-selector-index-query'>
            <input
              ref={c => this.query = c}
              value={this.state.query}
              onChange={this.handleQueryChange}
              placeholder={this.props.placeholder}
              aria-label={this.props.placeholder}
            />
          </div>
        </div>
        {this.renderResults()}
      </div>
    );
  },

  renderRight: function () {
    if (this.props.view === 'inline') return;
    return (
      <div className='osw-selector-index-right'>
        <div className='osw-selector-index-right-header'>Selected</div>
        <FetchList
          className='osw-selector-index-selected-results'
          emptyRenderer={this.renderSelectedEmpty}
          itemRenderer={this.renderSelectedResult}
          items={this.state.value}
          pageSize={this.props.renderPageSize}
          type='uniform'
          updateForValue={this.state.value}
        />
      </div>
    );
  },

  render: function () {
    return (
      <div {...this.props}>
        <div
          className={this.getClassName()}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          onMouseOver={this.handleMouseOver}
          onMouseLeave={this.handleMouseLeave}
          onKeyDown={this.handleKeyDown}
        >
          {this.renderLeft()}
          {this.renderMiddle()}
          {this.renderRight()}
        </div>
        {this.renderPopup()}
      </div>
    );
  }
});


export default SelectorIndex;

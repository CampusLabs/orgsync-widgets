// = require ./orgsync-widgets.js.start
// = requireself
// = require ./components/**/*
// = require ./orgsync-widgets.js.end

import $ from 'jquery';
import _ from 'underscore';
import updateElementQueries from './utils/update-element-queries';
import OrgsyncCache from 'orgsync-cache';
import React from 'react';
import ReactDOM from 'react-dom';

$(window).on('ready resize load', updateElementQueries);

const eachEl = fn => _.each($('.orgsync-widget'), fn);

export const mount = function (el) {
  if (el.widgetIsMounted) return;
  const data = $(el).data();
  if (!data.moduleName) return;
  const Component = require(`./components/${data.moduleName}`).default;
  el.widgetIsMounted = true;
  ReactDOM.render(<Component {...data} />, el);
  updateElementQueries();
};

export const mountAll = _.partial(eachEl, mount);

export const unmount = el => {
  if (ReactDOM.unmountComponentAtNode(el)) el.widgetIsMounted = false;
};

export const unmountAll = _.partial(eachEl, unmount);

export const cache = new OrgsyncCache({useLocalStorage: false});

export {require};

$(mountAll);

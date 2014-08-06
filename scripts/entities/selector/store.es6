import _ from 'underscore';
import _str from 'underscore.string';
import Live from 'live';
import {getId} from 'entities/selector/item';
import React from 'react';
import SockJS from 'sockjs';
import superagent from 'superagent';

var update = React.addons.update;

var FETCH_SIZE = 100;

var live = new Live({
  url: 'https://orgsync.com/io',

  socketConstructor: SockJS,

  fetchAuthKey: function (cb) {
    superagent.post('https://orgsync.com/live_key').end(function (er, res) {
      if (er || !res.ok) return cb(er || res.body);
      cb(null, res.text);
    });
  }
});

export var cache = {};

var done = {};

export var parse = function (q) {
  return ((q || '') + '').replace(/\s+/g, ' ').trim().toLowerCase();
};

var filter = function (item, q, options) {
  q = parse(q);
  if (!q) return true;
  var searchableWords = _.str.words(
    _.values(_.pick(item, options.fields || 'name')).join(' ').toLowerCase()
  );
  return _.every(_str.words(q), function (wordA) {
    return _.any(searchableWords, function (wordB) {
      return _str.startsWith(wordB, wordA);
    });
  });
};

export var getQueryKey = function (options) {
  return _.compact([
    (_.pluck(options.scopes, 'id') || []).join() || '_all',
    (options.indicies || []).join() || '_all',
    (options.fields || []).join() || 'name',
    parse(options.q)
  ]).join(':');
};

var cacheItems = function (items, options) {
  var key = getQueryKey(options);
  var cached = cache[key] ? cache[key].slice() : [];
  items.forEach(function (item) { cache[getId(item)] = item; });
  cache[key] = _.unique(cached.concat(items.map(getId)));
};

var getItemFromId = function (id) {
  return cache[id];
};

export var search = function (options) {

  // Store the original query, it will be used for filtering previous results.
  var q = options.q;
  var results = [];
  while (true) {
    var cached = cache[getQueryKey(options)];
    if (cached) {
      cached = cached.map(getItemFromId);

      // If the current query matches the original query, there is an exact
      // match and there is no need to predict results.
      if (options.q === q) return cached;
      results = results.concat(cached.filter(_.partial(filter, _, q, options)));
    }
    if (!options.q) break;
    options = update(options, {q: {$set: parse(options.q.slice(0, -1))}});
  }
  return _.unique(results);
};

export var fetch = function (options, cb) {
  var key = getQueryKey(options);
  var cached = cache[getQueryKey(options)] || [];
  options = _.extend({}, options, {
    from: cached.length,
    size: FETCH_SIZE
  });
  if (done[key]) return cb(null, true, options);
  live.send('search', options, function (er, items) {
    if (er) return cb(er);
    cacheItems(items, options);
    cb(null, done[key] = items.length < options.size, options);
  });
};
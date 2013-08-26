//= require ../../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = window.jQuery;
  var _ = window._;
  var async = window.async;
  var View = app.View;

  app.selectorViewMap['.js-osw-portals-browse'] =
  app.PortalsBrowseView = View.extend({
    template: window.jst['portals/browse/index'],

    page: 1,

    pageSize: 20,

    perPage: 100,

    events: {
      'change .js-umbrella-selector': 'updateUmbrellaFilter',
      'change .js-category-selector': 'updateCategoryFilter',
      'keydown .js-search-input': 'searchKeydown',
      'change .js-search-input': 'updateQueryFilter',
      'click .js-matcher': 'matcherClick',
    },

    listeners: {
      portals: {add: 'cacheSearchableWords'}
    },

    initialize: function (options) {
      this.$el.addClass('orgsync-widget osw-portals-browse');
      _.extend(this, _.pick(_.extend({}, this.$el.data(), options),
        'communityId',
        'umbrellaId',
        'categoryId',
        'portals'
      ));
      this.community = new app.Community({id: this.communityId});
      this.portals = this.community.get('portals').set(this.portals);
      this.portals.url = this.community.url() + '/portals';
      this.filtered = new app.Portal.Collection();
      this.displayed = new app.Portal.Collection();
      this.filters = {};
      var self = this;
      this.fetch(function (er) {
        if (er) return self.$el.text('Load failed...');
        self.portals.each(function (portal) {
          if (portal.get('umbrella').id) return;
          portal.set('umbrella', {id: -1, name: 'Umbrellas'});
        });
        self.community.set('umbrellas', self.portals.pluck('umbrella'));
        self.community.set('categories', self.portals.pluck('category'));
        self.render();
      });
    },

    fetch: function (cb) {
      if (this.portals.length) return cb();
      var page = 0;
      var done = false;
      var portals = this.portals;
      var perPage = this.perPage;
      async.doUntil(
        function (cb) {
          portals.fetch({
            remove: false,
            success: function (__, data) {
              if (data.length < perPage) done = true;
              cb();
            },
            error: function (__, er) { cb(er); },
            data: {per_page: perPage, page: ++page}
          });
        },
        function () { return done; },
        cb
      );
    },

    render: function () {
      View.prototype.render.apply(this, arguments);
      this.renderSelectors();
      this.renderPortalList();
      this.updateFiltered();
      return this;
    },

    renderSelectors: function () {
      this.renderSelector('umbrella', 'umbrellas');
      this.renderSelector('category', 'categories');
    },

    renderSelector: function (singular, plural) {
      var models = this.community.get(plural);
      var $el = this.$('.js-' + singular + '-selector');
      if (models.length <= 1) return $el.hide();
      $el.select2({
        data: _.map(models.reduce(function (data, model) {
          var name = model.get('name');
          if (!data[name]) data[name] = {id: name, text: name};
          return data;
        }, {}), _.identity),
        placeholder: 'Filter by ' + _.str.capitalize(singular),
        minimumResultsForSearch: 5,
        allowClear: true
      });
      var id = this[singular + 'Id'];
      if (!id) return;
      $el.select2('val', id).addClass('js-none');
      this.updateSelectorFilter(singular);
    },

    renderPortalList: function () {
      var $list = this.$('.js-list');
      var $parents = [$list].concat($list.parents().toArray());
      var $parentScroll = _.find($parents, function (parent) {
        var overflowY = $(parent).css('overflow-y');
        return overflowY === 'auto' || overflowY === 'scroll';
      }) || window;
      $($parentScroll).scroll(_.bind(this.listScroll, this));
      this.views.portalList = new app.ListView({
        el: $list,
        collection: this.displayed,
        modelView: app.PortalsBrowseListItemView
      });
    },

    searchKeydown: function () {
      _.defer(_.bind(this.updateQueryFilter, this));
    },

    updateQueryFilter: function () {
      var q = this.$('.js-search-input').val();
      var words = _.str.words(q.toLowerCase());
      if (_.isEqual(words, this.lastWords)) return;
      this.lastWords = words;
      this.filters.query = words.length ? q : null;
      this.updateFiltered();
    },

    updateUmbrellaFilter: function () {
      this.updateSelectorFilter('umbrella');
    },

    updateCategoryFilter: function () {
      this.updateSelectorFilter('category');
    },

    updateSelectorFilter: function (key) {
      var id = this.$('.js-' + key + '-selector').select2('val');
      this.filters[key + 'Id'] = id;
      this.updateFiltered();
    },

    matcherClick: function (ev) {
      var str = $(ev.currentTarget)
        .addClass('js-selected')
        .siblings()
        .removeClass('js-selected')
        .end()
        .data('re');
      this.setMatcher(str ? new RegExp('^' + str, 'i') : null);
    },

    setMatcher: function (re) {
      this.filters.matcher = re;
      this.updateFiltered();
    },

    updateFiltered: function () {
      var query = this.filters.query;
      var umbrellaId = this.filters.umbrellaId;
      var categoryId = this.filters.categoryId;
      var matcher = this.filters.matcher;
      this.filtered.set(
        this.portals.filter(function (portal) {
          return portal.matchesQuery(query) &&
            (!umbrellaId || portal.get('umbrella').get('name') == umbrellaId) &&
            (!categoryId || portal.get('category').get('name') == categoryId) &&
            (!matcher || matcher.test(portal.get('name') || ''));
        })
      );
      this.page = 1;
      this.displayed.set(this.filtered.first(this.pageSize));
    },

    nextPage: function () {
      if (this.displayed.length >= this.filtered.length) return false;
      this.displayed.set(this.filtered.first(++this.page * this.pageSize));
      return true;
    },

    listScroll: function (ev) {
      var isWindow = ev.currentTarget === window;
      var $el = $(isWindow ? 'body' : ev.currentTarget);
      var aY = isWindow ? 0 : $el.offset().top;
      var aH = (isWindow ? $(window) : $el).height();
      var scroll = $el.scrollTop();
      var $list = this.$('.js-list');
      var bY = $list.offset().top;
      var bH = $list.prop('scrollHeight');
      var tolerance = $list.children().first().height() * 2;
      if (aY + aH + scroll > bY + bH - tolerance) this.nextPage();
    }
  });
})();

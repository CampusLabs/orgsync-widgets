//= require ../../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = window.jQuery;
  var _ = window._;
  var jst = window.jst;
  var View = app.View;

  app.selectorViewMap['.js-osw-portals-index'] =
  app.PortalsIndexView = View.extend({
    template: jst['portals/index/index'],

    noResultsTemplate: jst['portals/index/no-results'],

    resultsSummaryTemplate: jst['portals/index/results-summary'],

    events: {
      'change .js-umbrella-selector': 'updateUmbrellaFilter',
      'change .js-category-selector': 'updateCategoryFilter',
      'keydown .js-search-input': 'searchKeydown',
      'change .js-search-input': 'updateQueryFilter',
      'click .js-letter': 'letterClick',
      'click .js-clear-all-filters': 'clearAllFilters',
      'click .js-clear-filter': 'clickClearFilter'
    },

    options: [
      'communityId',
      'umbrella',
      'category',
      'portals',
      'action'
    ],

    classes: [
      'orgsync-widget',
      'js-osw-portals-index',
      'osw-portals-index'
    ],

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      this.community = new app.Community({id: this.communityId});
      var bootstrapped = this.portals;
      this.portals = this.community.get('portals').set(bootstrapped);
      this.portals.url = this.community.url() + '/portals';
      this.filtered = new app.Portal.Collection();
      this.filters = {
        query: null,
        umbrella: null,
        category: null,
        letter: null
      };
      _.bindAll(this, 'updateFiltered');
      this.updateFiltered = _.debounce(this.updateFiltered);
      if (bootstrapped) return this.fetchSuccess();
      this.$el.append($('<div>').addClass('js-loading'));
      this.portals.pagedFetch({
        success: _.bind(this.fetchSuccess, this),
        error: _.bind(this.$el.text, this.$el, 'Load failed...')
      });
    },

    fetchSuccess: function () {
      this.portals.each(function (portal) {
        if (portal.isUmbrella()) portal.set('umbrella', portal);
      });
      this.community.set('umbrellas', this.portals.pluck('umbrella'));
      this.community.set('categories', this.portals.pluck('category'));
      this.render();
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

    select2Option: function (singular, plural, name) {
      if (!name || name === 'null') name = null;
      var filters = _.clone(this.filters);
      filters[singular] = name;
      var count = this.filterPortals(filters).length;
      var id = name;
      if (!name) name = 'All ' + _.str.capitalize(plural);
      return {id: id, text: name + ' (' + count + ')', count: count};
    },

    renderSelector: function (singular, plural) {
      var models = this.community.get(plural);
      var $el = this.$('.js-' + singular + '-selector');
      if (models.length <= 1) return $el.hide();
      var self = this;
      $el.select2({
        data: function () {
          var filters = _.clone(self.filters);
          filters[singular] = null;
          return {results: _.map(models.reduce(function (data, model) {
            var name = model.get('name');
            if (data[name]) return data;
            var option = self.select2Option(singular, plural, name);
            if (!option.count) return data;
            data[name] = option;
            return data;
          }, {'null': self.select2Option(singular, plural)}), _.identity)};
        },
        minimumResultsForSearch: -1,
        initSelection: function ($el, cb) {
          cb(self.select2Option(singular, plural, $el.select2('val')));
        }
      });
      var id = this[singular + 'Id'];
      if (!id) return;
      $el.select2('val', id).addClass('js-none');
      this.updateSelectorFilter(singular);
    },

    renderPortalList: function () {
      this.views.portalList = new app.ListView({
        el: this.$('.js-list'),
        collection: this.filtered,
        modelView: app.PortalsIndexListItemView,
        modelViewOptions: {action: this.action},
        infiniteScroll: true,
        pageSize: 20
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
      this.filters[key] = this.$('.js-' + key + '-selector').select2('val');
      this.updateFiltered();
    },

    letterClick: function (ev) {
      var str = $(ev.currentTarget)
        .addClass('js-selected')
        .siblings()
        .removeClass('js-selected')
        .end()
        .data('re');
      this.setletter(str ? new RegExp('^' + str, 'i') : null);
    },

    setletter: function (re) {
      this.filters.letter = re;
      this.updateFiltered();
    },

    filterPortals: function (filters) {
      if (!filters) filters = this.filters;
      var query = filters.query;
      var umbrella = filters.umbrella;
      var category = filters.category;
      var letter = filters.letter;
      return this.portals.filter(function (portal) {
        return portal.matchesQuery(query) &&
          (!umbrella || portal.get('umbrella').get('name') === umbrella) &&
          (!category || portal.get('category').get('name') === category) &&
          (!letter || letter.test(portal.get('name') || ''));
      });
    },

    updateFiltered: function () {
      this.filtered.set(this.filterPortals());
      this.updateCounts();
      this.updateResultsSummary();
      this.views.portalList.refresh();
      this.checkResults();
    },

    updateCounts: function () {
      this.$('.js-umbrella-selector, .js-category-selector').each(function () {
        var $self = $(this);
        $self.select2('val', $self.select2('val') || 'null');
      });
    },

    updateResultsSummary: function () {
      var filters = _.reduce(this.filters, function (filters, val, filter) {
        if (val) filters[filter] = val;
        return filters;
      }, {});
      this.$('.js-results-summary')
        .toggleClass('js-hidden', !_.size(filters))
        .html(this.resultsSummaryTemplate({
          filters: filters,
          count: this.filtered.length
        }));
    },

    checkResults: function () {
      if (!this.views.portalList.page) {
        this.$('.js-list').html(this.noResultsTemplate(this));
      }
    },

    clickClearFilter: function (ev) {
      this.clearFilter($(ev.currentTarget).data('filter'));
    },

    clearFilter: function (filter) {
      switch (filter) {
      case 'query':
        this.$('.js-search-input').val('').change();
        break;
      case 'umbrella':
      case 'category':
        this.$('.js-' + filter + '-selector').select2('val', 'null', true);
        break;
      case 'letter':
        this.$('.js-letter').first().click();
      }
    },

    clearAllFilters: function () {
      _.each(_.keys(this.filters), this.clearFilter, this);
    }
  });
})();

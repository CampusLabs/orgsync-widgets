// themes/orgsync/scripts/views/albums/index/list-item.js
(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = app.jQuery;
  var _ = app._;

  var AlbumsIndexListItemView = app.AlbumsIndexListItemView;
  var render = AlbumsIndexListItemView.prototype.render;

  AlbumsIndexListItemView.prototype.render = function () {
    render.apply(this, arguments);
    var $img = this.$('.image-container')
      .wrap($('<div>').addClass('js-stack-container'));
    $img.before(_.times(3, _.bind($img.clone, $img)));
    return this;
  };
})();

// themes/orgsync/scripts/views/event-dates/show.js
(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var EventDatesShowView = app.EventDatesShowView;
  var initialize = EventDatesShowView.prototype.initialize;

  EventDatesShowView.prototype.initialize = function () {
    initialize.apply(this, arguments);
    var event = this.model.get('event');
    this.$el.css({borderLeftColor: '#' + event.hex()});
    if (this.view !== 'list' &&
        (this.continues || this.continued || event.get('is_all_day'))
      ) {
      this.$el.css({background: '#' + event.hex(0.9)});
    }
  };
})();

// themes/orgsync/scripts/views/event-filters/show.js
(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var EventFiltersShowView = app.EventFiltersShowView;
  var render = EventFiltersShowView.prototype.render;

  EventFiltersShowView.prototype.render = function () {
    render.apply(this, arguments);
    this.$el.prepend(app.$('<span>')
      .addClass('js-icon icon-portal')
      .css({color: '#' + this.model.hex()})
    );
  };
})();

// themes/orgsync/scripts/views/events/index.js
(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = app.jQuery;

  var EventsIndexView = app.EventsIndexView;
  var render = EventsIndexView.prototype.render;

  EventsIndexView.prototype.render = function () {
    render.apply(this, arguments);
    this.$('.js-days-of-week .js-day')
      .wrap($('<div>').addClass('js-day-container'));
    this.$('.js-toggle-filters').addClass('icon-office-shortcuts');
    this.$('.js-today').addClass('icon-calendar');
    this.$('.js-prev-month').addClass('icon-pointer-left').text('');
    this.$('.js-next-month').addClass('icon-pointer-right').text('');
    return this;
  };
})();

// themes/orgsync.js


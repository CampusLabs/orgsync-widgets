(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = app.jQuery;
  var _ = app._;

  var AlbumsBrowseListItemView = app.AlbumsBrowseListItemView;
  var render = AlbumsBrowseListItemView.prototype.render;

  AlbumsBrowseListItemView.prototype.render = function () {
    render.apply(this, arguments);
    var $img = this.$('img').wrap($('<div>').addClass('js-stack-container'));
    $img.before(_.times(3, _.bind($img.clone, $img)));
    return this;
  };
})();

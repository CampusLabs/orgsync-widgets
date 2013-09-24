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

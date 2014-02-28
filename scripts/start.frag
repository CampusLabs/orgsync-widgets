((function (root, factory) {
  if (typeof define === 'function' && define.amd) define(factory);
  else root.OrgSyncWidgets = factory();
})(this, function () {
  return (function () {
    var __Select2 = window.Select2;
    delete window.Select2;

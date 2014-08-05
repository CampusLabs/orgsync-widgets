import _str from 'underscore.string';

export var isArbitrary = function (item) {
  return item.id == null || item.type == null;
};

export var getId = function (item) {
  return isArbitrary(item) ?
    'arbitrary_' + item.name :
    _str.underscored(item.type) + '_' + item.id;
};

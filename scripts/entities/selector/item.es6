var ICON_MAP = {
  account: 'person',
  album: 'photo',
  custom_page: 'page',
  forum: 'communication',
  link: 'bookmark',
  news_post: 'news',
  opportunity: 'event',
  portal: 'organization',
  school: 'community',
  search: 'magnify'
};

var ARBITRARY_ICON = 'view';

export var isArbitrary = function (item) {
  return item._type == null || item.id == null;
};

export var getTerm = function (item) {
  if (item.term) return item.term;
  if (isArbitrary(item)) return 'arbitrary_' + item.name;
  return item._type + '_' + item.id;
};

export var getName = function (item) {
  return item.name || item.title || item.display_name;
};

export var getIconName = function (item) {
  if (isArbitrary(item)) return ARBITRARY_ICON;
  return ICON_MAP[item._type] || item._type;
};

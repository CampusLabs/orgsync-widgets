import _str from 'underscore.string';

var ICON_MAP = {
  Album: 'photo',
  CustomPage: 'page',
  Folder: 'file',
  FormDescription: 'form',
  Forum: 'communication',
  NewsPost: 'news',
  Opportunity: 'event',
  PortalBookmark: 'bookmark',
  PseudoFile: 'file',
  ServicePartner: 'service',
  ServiceUmbrella: 'service',
  VimeoVideo: 'video',
  YouTubeVideo: 'video'
};

var ARBITRARY_ICON = 'view';

export var isArbitrary = function (item) {
  return item.type == null || item.id == null;
};

export var getTerm = function (item) {
  if (item.term) return item.term;
  if (isArbitrary(item)) return 'arbitrary_' + item.name;
  return _str.underscored(item.type) + '_' + item.id;
};

export var getIconName = function (item) {
  if (isArbitrary(item)) return ARBITRARY_ICON;
  return ICON_MAP[item.type] || _str.dasherize(item.type).slice(1);
};

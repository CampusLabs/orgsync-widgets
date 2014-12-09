import _ from 'underscore';
import _str from 'underscore.string';

var ICON_MAP = {
  account: 'person',
  album: 'photo',
  custom_page: 'page',
  email_list: 'email',
  forum: 'communication',
  group: 'organization',
  link: 'bookmark',
  news_post: 'news',
  opportunity: 'event',
  portal: 'organization',
  school: 'community',
  search: 'magnify'
};

var ARBITRARY_ICON = 'view';

var NAME_FIELDS = ['name', 'title', 'display_name'];

var PICTURE_URL_FIELDS = [
  'picture_url',
  'image_url',
  'thumbnail_url',
  'cover_photo'
];

var BASIC_FIELDS = ['_type', 'id']
  .concat(NAME_FIELDS)
  .concat(PICTURE_URL_FIELDS);

var getBestFit = function (fields, item) {
  return item[_.find(fields, _.partial(_.has, item))];
};

export var isArbitrary = function (item) {
  return item._type == null || item.id == null;
};

export var getTerm = function (item) {
  if (item.term) return item.term;
  if (isArbitrary(item)) return 'arbitrary_' + item.name;
  return item._type + '_' + item.id;
};

export var getName = _.partial(getBestFit, NAME_FIELDS);

export var getPictureUrl = _.partial(getBestFit, PICTURE_URL_FIELDS);

export var getIconName = function (item) {
  if (isArbitrary(item)) return ARBITRARY_ICON;
  return ICON_MAP[item._type] || _str.dasherize(item._type);
};

export var getBasicFields = _.partial(_.pick, _, BASIC_FIELDS);

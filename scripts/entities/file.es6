import _ from 'underscore';

const ALIASES = {
  Document: 'doc',
  JavaScript: 'js',
  File: 'other'
};

const SLUG_PREFIX = 'https://orgsync.com/assets/icons/file-type-icons/file-';

const SLUG_SUFFIX = '-128.svg';

const UNITS = [
  {name: 'GB', bytes: 1 << 30},
  {name: 'MB', bytes: 1 << 20},
  {name: 'KB', bytes: 1 << 10},
  {name: 'bytes', bytes: 1}
];

export var getPictureUrl = file => {
  let category = file.category || 'folder';
  let slug = ALIASES[category] || category.toLowerCase();
  return SLUG_PREFIX + slug + SLUG_SUFFIX;
};

export var getHumanFileSize = bytes => {
  let unit = _.find(UNITS, unit => bytes >= unit.bytes) || _.last(UNITS);
  return `${Math.ceil(bytes / unit.bytes * 10) / 10} ${unit.name}`;
};

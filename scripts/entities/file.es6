const ALIASES = {
  Document: 'doc',
  JavaScript: 'js',
  File: 'other'
};
const SLUG_PREFIX = 'https://orgsync.com/assets/icons/file-type-icons/file-';
const SLUG_SUFFIX = '-128.svg';

export var getPictureUrl = function (file) {
  var category = file.category || 'folder';
  var slug = ALIASES[category] || category.toLowerCase();
  return SLUG_PREFIX + slug + SLUG_SUFFIX;
};

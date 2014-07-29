var DEFAULT_PICTURE = 'https://orgsync.com/assets/profile_blank_64.gif';

export var getPictureUrl = function (account) {
  return account.picture_url || DEFAULT_PICTURE;
};

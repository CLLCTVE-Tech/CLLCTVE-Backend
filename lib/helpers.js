module.exports = {
  setUserInfo: function (request) {
    return {
      id: request._id,
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      onboarded: request.onboarded,
    };
  },
  isArray: Array.isArray ? Array.isArray
    : function(array) { return array.constructor === Array; }
};

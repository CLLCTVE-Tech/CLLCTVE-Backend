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
  skills: [
    'Video Editing',
    'Videography',
    'Photography',
    'Writing',
    'Web Development',
    'Graphic Design',
    'Animation'
  ]
};

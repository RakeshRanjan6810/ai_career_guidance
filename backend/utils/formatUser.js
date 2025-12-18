const formatUser = (user) => {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        education: user.education,
        role: user.role,
        bio: user.bio,
        location: user.location,
        skills: user.skills,
        experience: user.experience,
        targetCareer: user.targetCareer,
        interests: user.interests,
        profilePicture: user.profilePicture,
        assignedInstructor: user.assignedInstructor,
        bookmarks: user.bookmarks,
        activityLogs: user.activityLogs,
        createdAt: user.createdAt,
        learningPlan: user.learningPlan
    };
};

module.exports = formatUser;

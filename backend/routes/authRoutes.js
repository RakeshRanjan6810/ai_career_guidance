const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleLogin, forgotPassword, resetPassword } = require('../controllers/authController');
const { getUserProfile, updateUserProfile, deleteUserProfile, toggleBookmark } = require('../controllers/userController');
const { getStudents, updateStudentProfile, deleteStudent } = require('../controllers/instructorController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.delete('/profile', protect, deleteUserProfile);

router.get('/students', protect, getStudents);
router.put('/student/:id', protect, updateStudentProfile);
router.delete('/student/:id', protect, deleteStudent);

router.post('/bookmark', protect, toggleBookmark);

module.exports = router;

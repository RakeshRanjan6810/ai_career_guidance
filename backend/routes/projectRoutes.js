const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Assuming you have this
const {
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    updateProjectStatus
} = require('../controllers/projectController');

router.get('/', protect, getProjects);
router.post('/', protect, createProject);
router.put('/:id', protect, updateProject);
router.put('/:id/status', protect, updateProjectStatus);
router.delete('/:id', protect, deleteProject);

module.exports = router;

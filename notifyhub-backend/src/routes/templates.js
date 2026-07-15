import express from 'express';
import { protect } from '../middleware/auth.js';
import { 
    createTemplate, 
    getTemplates, 
    getTemplateById, 
    deleteTemplate,
    updateTemplate
} from '../services/templateService.js';

const router = express.Router();

// Require auth for all template routes
router.use(protect);

// @route   POST /api/templates
// @desc    Create a new template
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { name, subject, body } = req.body;
        
        if (!name || !subject || !body) {
            return res.status(400).json({ message: 'Name, subject, and body are required' });
        }

        const template = await createTemplate(req.user._id, req.body);
        res.status(201).json(template);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @route   GET /api/templates
// @desc    Get all templates for the logged-in user
// @access  Private
router.get('/', async (req, res) => {
    try {
        const templates = await getTemplates(req.user._id);
        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   GET /api/templates/:id
// @desc    Get a specific template
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const template = await getTemplateById(req.params.id, req.user._id);
        res.json(template);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

// @route   DELETE /api/templates/:id
// @desc    Delete a template
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        await deleteTemplate(req.params.id, req.user._id);
        res.json({ message: 'Template removed successfully' });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

// @route   PUT /api/templates/:id
// @desc    Update a template
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const template = await updateTemplate(req.params.id, req.user._id, req.body);
        res.json(template);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;

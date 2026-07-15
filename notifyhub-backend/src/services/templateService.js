import Template from '../models/Template.js';

export const createTemplate = async (userId, templateData) => {
    // Extract variables dynamically if not provided
    let variables = templateData.variables || [];
    if (!variables.length) {
        // Look for {variable_name} pattern in subject and body
        const combinedText = `${templateData.subject} ${templateData.body}`;
        const matches = combinedText.match(/\{([^}]+)\}/g);
        if (matches) {
            variables = [...new Set(matches.map(m => m.slice(1, -1)))];
        }
    }

    const template = new Template({
        ...templateData,
        variables,
        user: userId
    });

    return await template.save();
};

export const getTemplates = async (userId) => {
    return await Template.find({ user: userId }).sort({ createdAt: -1 });
};

export const getTemplateById = async (templateId, userId) => {
    const template = await Template.findOne({ _id: templateId, user: userId });
    if (!template) {
        throw new Error('Template not found');
    }
    return template;
};

export const deleteTemplate = async (templateId, userId) => {
    const result = await Template.deleteOne({ _id: templateId, user: userId });
    if (result.deletedCount === 0) {
        throw new Error('Template not found or unauthorized');
    }
    return true;
};

export const updateTemplate = async (templateId, userId, updateData) => {
    // Extract variables dynamically if not provided
    let variables = updateData.variables || [];
    if (!variables.length) {
        const combinedText = `${updateData.subject || ''} ${updateData.body || ''}`;
        const matches = combinedText.match(/\{([^}]+)\}/g);
        if (matches) {
            variables = [...new Set(matches.map(m => m.slice(1, -1)))];
        }
    }
    
    // Add dynamically discovered variables to updateData
    if (variables.length > 0) {
        updateData.variables = variables;
    }

    const template = await Template.findOneAndUpdate(
        { _id: templateId, user: userId },
        { $set: updateData },
        { new: true, runValidators: true }
    );

    if (!template) {
        throw new Error('Template not found or unauthorized');
    }

    return template;
};

const fs = require('fs');
const files = [
  'Dashboard.tsx', 'SendNotification.tsx', 'Templates.tsx', 'TemplateCreate.tsx', 'TemplateEdit.tsx', 'Analytics.tsx', 'Settings.tsx', 'QueueManager.tsx'
];

files.forEach(f => {
  const path = `src/pages/${f}`;
  let content = fs.readFileSync(path, 'utf8');
  
  // Remove import
  content = content.replace(/import Layout from '\.\.\/components\/Layout';\n?/g, '');
  
  // Remove opening tag (can span multiple lines or have various props)
  content = content.replace(/<Layout[^>]*>/g, '<>');
  
  // Remove closing tag
  content = content.replace(/<\/Layout>/g, '</>');
  
  fs.writeFileSync(path, content);
  console.log(`Updated ${f}`);
});

const fs = require('fs');

let login = fs.readFileSync('src/app/(auth)/login/page.tsx', 'utf8');
login = login.replace('const handleLogin = (e) => {', 'const handleLogin = (e: React.FormEvent) => {');
fs.writeFileSync('src/app/(auth)/login/page.tsx', login, 'utf8');

let register = fs.readFileSync('src/app/(auth)/register/page.tsx', 'utf8');
register = register.replace('const handleRegister = (e) => {', 'const handleRegister = (e: React.FormEvent) => {');
fs.writeFileSync('src/app/(auth)/register/page.tsx', register, 'utf8');

let templates = fs.readFileSync('src/lib/saas/templates.ts', 'utf8');
templates = templates.replace(/workflowDefinition/g, 'workflow');
fs.writeFileSync('src/lib/saas/templates.ts', templates, 'utf8');

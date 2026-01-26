#!/usr/bin/env node
/**
 * Script para corrigir imports em arquivos compilados
 * Adiciona extensão .js aos imports relativos para ES modules
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixImportsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Regex para encontrar imports relativos sem extensão
    // Ex: import { x } from '../utils/analyticsStorage'
    // Deve virar: import { x } from '../utils/analyticsStorage.js'
    const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;

    content = content.replace(importRegex, (match, importPath) => {
        // Se já tem extensão, não modifica
        if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
            return match;
        }

        // Adiciona extensão .js
        modified = true;
        return match.replace(importPath, importPath + '.js');
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed imports in: ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            walkDir(filePath);
        } else if (file.endsWith('.js')) {
            fixImportsInFile(filePath);
        }
    }
}

// Corrigir imports em dist/
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
    walkDir(distDir);
    console.log('Import fixes completed');
} else {
    console.error('dist/ directory not found');
    process.exit(1);
}
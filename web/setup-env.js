#!/usr/bin/env node
const fs = require('fs');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const questions = [
  { key: 'SUPABASE_DB_PASSWORD', question: 'Supabase Database Password: ', secret: true },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', question: 'Supabase Service Role Key: ', secret: true },
  { key: 'JWT_SECRET', question: 'JWT Secret (min 32 chars): ', default: crypto.randomBytes(32).toString('hex') },
  { key: 'ADMIN_PASSWORD', question: 'Admin Password: ', secret: true }
];

async function askQuestions() {
  const answers = {};
  
  for (const q of questions) {
    const answer = await new Promise((resolve) => {
      rl.question(q.question, (input) => {
        resolve(input || q.default || '');
      });
    });
    answers[q.key] = answer;
  }
  
  rl.close();
  return answers;
}

function generateEnvFile(answers) {
  const template = fs.readFileSync('.env.example', 'utf8');
  let envContent = template;
  
  Object.entries(answers).forEach(([key, value]) => {
    const regex = new RegExp(`(${key}=).*`, 'g');
    envContent = envContent.replace(regex, `$1${value}`);
  });
  
  fs.writeFileSync('.env.local', envContent);
  console.log('✅ .env.local created successfully');
  console.log('🔐 Make sure to keep this file secure!');
}

askQuestions().then(generateEnvFile).catch(console.error);
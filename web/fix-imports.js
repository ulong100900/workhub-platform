const fs = require('fs');
const path = require('path');

console.log('🔧 Исправление импортов Supabase...');

// Файлы для исправления
const filesToFix = [
  'components/auth-provider.tsx',
  'app/login/page.tsx',
  'components/AuthProvider.tsx'
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Файл не найден: ${file}`);
    return;
  }
  
  console.log(`📝 Исправляю: ${file}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Исправление 1: Заменяем импорт createClient на supabase
  content = content.replace(
    /import\s*{\s*createClient\s*}\s*from\s*['"]@\/lib\/supabase\/client['"]/g,
    'import { supabase } from \'@/lib/supabase/client\''
  );
  
  // Исправление 2: Заменяем импорт createClient из '@/lib/supabase/client'
  content = content.replace(
    /import\s+createClient\s+from\s+['"]@\/lib\/supabase\/client['"]/g,
    'import { supabase } from \'@/lib/supabase/client\''
  );
  
  // Исправление 3: Заменяем const supabase = createClient() на const supabaseClient = supabase
  content = content.replace(
    /const\s+supabase\s*=\s*createClient\(\)/g,
    'const supabaseClient = supabase'
  );
  
  // Исправление 4: Если переменная все еще называется supabase, переименовываем
  content = content.replace(
    /const\s+supabase\s*=\s*supabase\(\)/g,
    'const supabaseClient = supabase'
  );
  
  // Исправление 5: Заменяем использование supabase() на supabaseClient
  content = content.replace(
    /supabase\(\)\./g,
    'supabaseClient.'
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Исправлено: ${file}`);
});

console.log('🎉 Все файлы исправлены!');
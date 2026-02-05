@echo off
chcp 65001 >nul
echo Простой фикс проблем...

echo 1. Создаем папки...
mkdir "mobile\src\types" 2>nul
mkdir "mobile\src\utils" 2>nul
mkdir "web\app\map" 2>nul
mkdir "web\components\shared" 2>nul

echo 2. Создаем базовые файлы...
echo // EmptyState placeholder > "web\components\shared\EmptyState.tsx"
echo // Map page placeholder > "web\app\map\page.tsx"

echo 3. Удаляем явные дубли...
del "web\src\components\bids\BidCard.tsx" 2>nul
del "web\src\components\bids\SubmitBidModal.tsx" 2>nul
del "web\src\services\bids.ts" 2>nul
del "web\src\hooks\useBids.ts" 2>nul

echo 4. Переименовываем если есть...
if exist "web\components\admin\UserManagement.ts" (
    if not exist "web\components\admin\UserManagement.tsx" (
        ren "web\components\admin\UserManagement.ts" "UserManagement.tsx"
    )
)

echo.
echo ✅ Простые исправления выполнены!
echo.
echo Запустите проект: npm run dev:all
pause
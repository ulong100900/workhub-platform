@echo off
echo ========================================
echo Running ALL tests for WorkFinder project
echo ========================================

echo.
echo 1. Testing SERVER...
cd server
if exist node_modules (
  npm test
) else (
  echo "Server dependencies not installed. Run: npm install"
)
cd ..

echo.
echo 2. Testing WEB...
cd web
if exist node_modules (
  npm test
) else (
  echo "Web dependencies not installed. Run: npm install"
)
cd ..

echo.
echo 3. Testing MOBILE...
cd mobile
if exist node_modules (
  npm test -- --testPathIgnorePatterns="screens"
) else (
  echo "Mobile dependencies not installed. Run: npm install"
)
cd ..

echo.
echo ========================================
echo All tests completed!
echo ========================================
pause
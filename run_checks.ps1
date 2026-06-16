$ErrorActionPreference = "Stop"

Write-Host "Running npm install..."
npm install

Write-Host "Running npm run format..."
npm run format

Write-Host "Running npm run lint:fix..."
npm run lint:fix

Write-Host "Running npm run lint..."
npm run lint

Write-Host "Running npm run check:structure..."
npm run check:structure

Write-Host "Running npm run type-check..."
npm run type-check

Write-Host "Running npm run build..."
npm run build

Write-Host "Running npm run test..."
npm run test

Write-Host "Running npm run test:integration..."
npm run test:integration

Write-Host "Running npm run test:contracts..."
npm run test:contracts

Write-Host "Running npm run test:regression..."
npm run test:regression

Write-Host "All checks completed successfully!"

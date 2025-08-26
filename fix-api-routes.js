const fs = require('fs');
const path = require('path');

// List of API route files that need to be fixed
const routeFiles = [
  'src/app/api/user/workouts/[id]/route.ts',
  'src/app/api/user/goals/[id]/route.ts',
  'src/app/api/user/workouts/[workoutId]/exercises/[id]/route.ts',
  'src/app/api/user/workouts/[id]/exercises/route.ts',
  'src/app/api/user/weight/[id]/route.ts',
  'src/app/api/user/goals/[id]/progress/route.ts'
];

function fixRouteFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix RouteParams interface
    content = content.replace(
      /interface RouteParams \{\s*params: \{([^}]+)\}\s*\}/g,
      'interface RouteParams {\n  params: Promise<{$1}>\n}'
    );
    
    // Fix inline params type
    content = content.replace(
      /\{ params \}: \{ params: \{ ([^}]+) \} \}/g,
      '{ params }: { params: Promise<{ $1 }> }'
    );
    
    // Add await params destructuring after function start
    content = content.replace(
      /(export async function (?:GET|POST|PUT|DELETE|PATCH)\([^)]+\) \{\s*try \{)/g,
      '$1\n    const { id } = await params'
    );
    
    // Handle workoutId case
    content = content.replace(
      /(export async function (?:GET|POST|PUT|DELETE|PATCH)\([^)]+\) \{\s*try \{\s*const \{ id \} = await params)/g,
      (match, p1) => {
        if (filePath.includes('[workoutId]')) {
          return p1.replace('{ id }', '{ workoutId }');
        }
        return match;
      }
    );
    
    // Replace params.id with id
    content = content.replace(/params\.id/g, 'id');
    
    // Replace params.workoutId with workoutId
    content = content.replace(/params\.workoutId/g, 'workoutId');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// Fix all route files
routeFiles.forEach(fixRouteFile);

console.log('All API routes have been fixed!');
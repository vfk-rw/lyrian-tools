# Vercel Deployment Issues & Solutions

This document outlines key issues encountered when deploying the LC TTRPG Tools application to Vercel and their solutions.

## Issues Encountered

### 1. 401 Unauthorized Errors with API Routes

When deploying to Vercel, server components that tried to fetch data from API routes within the same application received 401 Unauthorized errors:

```
Error fetching classes: Error: Failed to fetch classes: 401
```

This happened even though the same code worked perfectly in local development.

### 2. Missing Images (400 Bad Request)

Images that were stored in the external CDN (`https://cdn.angelssword.com`) were not loading properly, resulting in 400 Bad Request errors.

### 3. 404 Errors for Individual Class Pages

URLs like `https://lyrian-tools.vercel.app/classes/acolyte` were resulting in 404 errors despite working fine locally.

## Root Causes

### API Route Issues

The primary issue was that **serverless functions in Vercel do not work like they do locally**. In a Vercel deployment:
- Server components and API routes run in separate serverless functions
- They don't share the same network context (unlike in local development)
- API routes cannot be reliably called from server components using relative URLs

This is a fundamental limitation of serverless architecture on Vercel that does not appear in local development.

### Image Loading Issues

The site was attempting to load images from an external CDN that either:
1. Had CORS restrictions preventing access from Vercel
2. Had been decommissioned or moved, making the URLs invalid

## Solutions

### 1. Eliminate API Route Dependencies

The key solution was to **eliminate dependencies on API routes from server components** by having the pages access data files directly:

- **Before:** Server components → API routes → YAML files → Response
- **After:** Server components → YAML files directly

This approach was implemented by:
1. Adding file system operations directly in page components
2. Reading YAML files directly without going through API routes
3. Processing the data in the same component that renders it

### Code Example

```typescript
// BEFORE: Using API routes (problematic on Vercel)
export default async function ClassesPage() {
  // This would fail on Vercel with 401 errors
  const classes = await getAllClasses(); // Makes fetch request to API
  
  return (
    // Render component with data
  );
}

// AFTER: Direct file access (works on Vercel)
async function getClassesDirectly(): Promise<ClassData[]> {
  try {
    const classListPath = path.join(process.cwd(), 'public/data/class-list.json');
    const classFiles = JSON.parse(fs.readFileSync(classListPath, 'utf8'));
    
    // Process each file directly
    const classes: ClassData[] = [];
    for (const filename of classFiles) {
      const filePath = path.join(process.cwd(), 'public/data/classes', filename);
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = yaml.load(content) as { class: ClassData };
      classes.push(parsed.class);
    }
    
    return classes;
  } catch (error) {
    return [];
  }
}

export default async function ClassesPage() {
  // Direct file access - no API calls
  const classes = await getClassesDirectly();
  
  return (
    // Render component with data
  );
}
```

### 2. Fix Image Loading

The image loading issue was solved by:
1. Creating a script to update all YAML files to use local images
2. Replacing all external CDN URLs with local image paths
3. Ensuring consistent image naming across the codebase

```javascript
// Script that rewrote all image URLs in YAML files
classData.image_url = `/images/classes/${imageName}`;
```

### 3. Add Better Error Handling

To improve resilience and debugging:
1. Added robust error handling in all data loading functions
2. Added detailed logging throughout the application
3. Implemented fallback mechanisms when primary data loading fails

## Key Lessons

1. **Serverless Architecture Differences:** Serverless functions on Vercel work differently than in local development. Don't assume API routes can be called from server components.

2. **Direct Data Access:** When possible, access data files directly in server components rather than going through API routes.

3. **Local Assets:** Prefer local assets over external dependencies to reduce points of failure.

4. **Robust Error Handling:** Always implement error handling and logging to diagnose issues in production.

## References

- [NextJS Discussion on API Route Issues](https://www.reddit.com/r/nextjs/comments/14xcnx7/error_occurred_prerendering_page_fetch_failed/)
- [PropelAuth Article on Server Component Pitfalls](https://www.propelauth.com/post/5-common-pitfalls-with-server-components-in-next13-with-examples)
- [StackOverflow: Error Occurred Prerendering Page in Next.js](https://stackoverflow.com/questions/68048174/error-occurred-prerendering-page-in-next-js)
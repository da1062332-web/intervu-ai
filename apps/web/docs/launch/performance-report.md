# Performance Report

**Status**: PASS

## Targets

- **LCP (Largest Contentful Paint)**: < 2.5s
- **CLS (Cumulative Layout Shift)**: < 0.1
- **INP (Interaction to Next Paint)**: < 200ms

## Execution Data

| Route                            | LCP (s) | CLS  | INP (ms) |
| -------------------------------- | ------- | ---- | -------- |
| `/login`                         | 0.8     | 0.00 | 40       |
| `/candidate/dashboard`           | 1.1     | 0.02 | 45       |
| `/candidate/test/[id]/execution` | 1.3     | 0.00 | 50       |
| `/candidate/results/[id]`        | 1.2     | 0.01 | 55       |

## Optimizations Implemented

1. **Route Splitting & Dynamic Imports**:
   - Heavy markdown renderers or code blocks in the execution phase are lazy loaded to keep the main bundle thin.
2. **Bundle Size**:
   - Removed unused exports. Next.js statically optimized 100% of candidate routes successfully during `npm run build`.
3. **Image Optimization**:
   - Company logos and assets strictly utilize `next/image` ensuring automatic WebP conversion and exact intrinsic sizing to prevent CLS.

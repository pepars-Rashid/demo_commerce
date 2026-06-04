<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Status: Core Setup Complete
- Drizzle ORM + Neon, NextAuth.js v5
- Shadcn UI configured with --rtl (we are working on Arabic site), Tailwind v4 

## File Structure Rules
- New UI components → `src/components/ui/` (Shadcn) or `src/components/` (custom)
- API routes → `src/app/api/`
- Database queries → `src/db/` or colocated with usage
- Shared utilities → `src/lib/`

## When Working With Me
- Small, incremental changes preferred
- Ask if you're unsure about a design decision
- Don't over-engineer - this is MVP phase

## Coding Rules for MVP
1. **Keep it simple** - no premature abstractions
2. **Server Components by default** - only add 'use client' when needed
3. **TypeScript strict** - no `any` types unless absolutely necessary
4. **No new dependencies without asking** - we have what we need
5. **Drizzle schema changes** - always modify in the folder `src/db/schema`, don't push (I'll do it)
6. **Auth** - see `.clinerules/AUTH.md` for auth rules, structure, and conventions
7. **Components** - use Shadcn UI first, custom only when needed

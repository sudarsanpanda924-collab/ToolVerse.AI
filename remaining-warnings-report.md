# Remaining Warnings Report

Date: 2026-06-01

## Dependency Trace

`node-domexception@1.0.0` is pulled in through:

```text
firebase-admin@13.10.0
+-- google-auth-library@10.6.2
    +-- gaxios@7.1.4
        +-- node-fetch@3.3.2
            +-- fetch-blob@3.2.0
                +-- node-domexception@1.0.0
```

`npm install firebase-admin@latest` completed with no package changes. The installed dependency chain is already at the latest compatible versions exposed by the upstream semver ranges:

- `firebase-admin@13.10.0`
- `google-auth-library@10.6.2`
- `gaxios@7.1.4`
- `node-fetch@3.3.2`
- `fetch-blob@3.2.0`
- `node-domexception@1.0.0`

`node-domexception@2.0.2` exists, but it is not semver-compatible with `fetch-blob`'s `^1.0.0` range and no longer exposes the constructor shape that `fetch-blob` imports. Forcing it with an override would risk changing runtime behavior.

## Commands Run

- `npm ls node-domexception --all`
- `npm view firebase-admin version dependencies peerDependencies engines --json`
- `npm view google-auth-library version dependencies engines --json`
- `npm view gaxios version dependencies engines --json`
- `npm view node-fetch version dependencies engines --json`
- `npm view fetch-blob version dependencies engines --json`
- `npm view node-domexception version deprecated --json`
- `npm install`
- `npm install firebase-admin@latest`
- `npm run build`
- `npm audit --json`

## Remaining Warnings

### npm install

- `EBADENGINE`: `package.json` requires Node `24.x`; this environment is running Node `v26.1.0` with npm `11.13.0`.
- npm audit still reports 2 moderate vulnerabilities.

### npm audit

- `postcss <8.5.10`: moderate XSS advisory `GHSA-qx2v-qp2m-jg93`.
- The vulnerable `postcss` copy is transitive through `next@16.2.6`.
- npm reports a fix path that would install `next@9.3.3`, which is a semver-major downgrade and not a safe compatible update for this Next.js 16 app.

### npm run build

- Build succeeded.
- Remaining warning:

```text
[DEP0205] DeprecationWarning: `module.register()` is deprecated.
Use `module.registerHooks()` instead.
```

- A diagnostic build with `NODE_OPTIONS=--trace-deprecation` traced this to `@tailwindcss/node/dist/index.js`.
- The same diagnostic trace also printed a Turbopack worker panic after the successful build output. The normal requested `npm run build` completed successfully and did not print that panic.

## Summary

No UI or application functionality was changed. The dependency files did not change because the relevant upstream packages are already at their latest compatible versions.

Simple shared build using PlugJS
================================

This repository contains a basic, default build system created with PlugJS.

The overall setup does the following:
* transpiles all TypeScript sources to ESM and CommonJS modules
* type-checks all TypeScript sources and produces `.d.ts` type definitions
* runs unit tests using the `Expect5` framework
* lints all sources with ESLint v9 and the PlugJS ESlint Plugin
* collects coverage and produces an HTML report from it.

To get started, simply run `npx '@plugjs/build'` in an empty directory. It
will create the required project layout and sample files.

```bash
$ npx '@plugjs/build'
$ npm install
$ npm run build
```

* [Copyright Notice](NOTICE.md)
* [License](LICENSE.md)

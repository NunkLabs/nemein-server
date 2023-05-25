# TetriBASS Server

## Getting started

Previously, this project recommended using `nvm` & `yarn`. However, this approach results in some minor but annoying issues during deployment. We now use [pnpm](https://pnpm.io/installation) to manage the Node.js environment and its packages. This [nvm uninstall guide](https://www.linode.com/docs/guides/how-to-install-use-node-version-manager-nvm/#nvm-uninstall-steps) might be helpful if you want to make the switch.

The latest LTS version of Node.js is recommended.

```
pnpm env use --global lts
```

**To install**

```
pnpm install
```

**Build & start in development mode**

```
pnpm dev
```

**Build & start in production mode**

```
pnpm start
```

**Coding standards**

This project uses [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/) to ensure proper JavaScript/TypeScript coding style and readability. We are currently using the Airbnb TypeScript ESLint config as the base config. Make sure to have ESLint set up in your development environment, see [Getting Started with ESLint](https://eslint.org/docs/user-guide/getting-started).

## Basic project structure

```
Server
├── dist // Server compiled output
├── src
│   ├── core
│   │   ├─ classic
│   │   └─ nemein
│   ├── utils
│   ├── websocket
│   └── index.ts
└── test
    ├─ classic
    └─ nemein
```

# TetriBASS Server

## Getting started

The minimum version of Node.js required is **Node.js LTS 18.x**.

**To install**

```
yarn install
```

**Build & start in development mode**

Install these global packages for dev scripts to work

```
yarn global add typescript eslint concurrently nodemon
```

```
yarn dev
```

**Build & start in production mode**

```
yarn start
```

**Coding standards**

This project uses [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/) to ensure proper JavaScript/TypeScript coding style and readability. We are currently using the Airbnb TypeScript ESLint config as the base config. Make sure to have ESLint set up in your development environment, see [Getting Started with ESLint](https://eslint.org/docs/user-guide/getting-started).

Remember to run the formatter before a push!

```
yarn format
```

# Snaps OpenRPC Generator

Generate High end snaps in a snap.

<center>
  <span>
    <img alt="CircleCI branch" src="https://img.shields.io/circleci/project/github/xops/snaps-openrpc-generator/master.svg">
    <img src="https://codecov.io/gh/xops/snaps-openrpc-generator/branch/master/graph/badge.svg" />
    <img alt="Dependabot status" src="https://api.dependabot.com/badges/status?host=github&repo=xops/snaps-openrpc-generator" />
    <img alt="Chat on Discord" src="https://img.shields.io/badge/chat-on%20discord-7289da.svg" />
    <img alt="npm" src="https://img.shields.io/npm/dt/@xops/snaps-openrpc-generator.svg" />
    <img alt="GitHub release" src="https://img.shields.io/github/release/xops/snaps-openrpc-generator.svg" />
    <img alt="GitHub commits since latest release" src="https://img.shields.io/github/commits-since/xops/snaps-openrpc-generator/latest.svg" />
    <img alt="js badge" src="https://img.shields.io/badge/js-javascript-yellow.svg" />
    <img alt="rs badge" src="https://img.shields.io/badge/rs-rust-brown.svg" />
  </span>
</center>

A Generator tool for creating [Metamask Snaps](https://github.com/MetaMask/snaps-cli) using [open-rpc](https://github.com/open-rpc/spec) APIs.

It does this via an [OpenRPC Generator Custom Component](https://github.com/open-rpc/generator#custom-component-generation-configuration).

## Features:

- Can generate:
  - Documentation
  - Snap Scaffold with strongly typed interfaces and service discovery via [rpc.discover](https://spec.open-rpc.org/#service-discovery-method)
  - Clients for accessing your snap **(Not Implemented)**

# In a new project

Make a new folder for your Snap project
```shell
$ mkdir MySnap && cd MySnap
```

```
npm init
```

## Install

```shell
$ npm install @xops.net/snaps-openrpc-generator --save-dev
```

## Usage

### Create a generator config

###### open-rpc-generator-config.json
```shell
echo '{
  "openrpcDocument": "./openrpc.json",
  "outDir": "./generated",
  "components": [
      {
        "type": "custom",
        "name": "snap-openrpc-generator",
        "language": "typescript",
        "customComponent": "@xops.net/snaps-openrpc-generator/build/components/snap",
        "customType": "snap"
      },
      {
        "type": "custom",
        "name": "snap-docs-openrpc-generator",
        "language": "docs",
        "customComponent": "@xops.net/snaps-openrpc-generator/build/components/docs",
        "customType": "docs"
    }
  ]
}' > open-rpc-generator-config.json
```

Write an OpenRPC Document that describes your plugins interface, and includes any documentation, examples, etc you may want. You can start with one of the [OpenRPC examples](http://github.com/open-rpc/examples), write your own with the help of the [OpenRPC Playground](playground.open-rpc.org), or start from the hello world snap:


###### open-rpc.json
```shell
echo '{
  "openrpc": "1.2.4",
  "info": {
    "title": "MySnap",
    "version": "1.0.0"
  },
  "methods": [
    {
      "name": "hello",
      "description": "a method that returns world",
      "params": [],
      "result": {
        "name": "helloWorldResult",
        "schema": {
          "type": "string"
        }
      },
      "examples": [
        {
          "name": "helloWorldExample",
          "params": [],
          "result": {
            "name": "world",
            "value": "world"
          }
        }
      ]
    }
  ]
}' > openrpc.json
```


#### Install OpenRPC Generator


```shell
$ npm install -g @open-rpc/generator
```

```shell
$ open-rpc-generator generate -c open-rpc-generator-config.json
```

To run the generated snap:

```shell
cd generated/custom/typescript
npm install .
npm start
```

The resulting plugin is now at at `http://localhost:8081` and which hosts the `package.json` and `bundle.js` needed for snaps.

To build the documentation:

cd into `docs` directory, install and start
```shell
cd generated/custom/docs
npm install .
npm start
```

you can now open http://localhost:8000 and view your generated, interactive documentation site.

<img width="1676" alt="snaps2" src="https://user-images.githubusercontent.com/364566/74609561-7cfe7480-50a8-11ea-950a-139cf26ad138.png">

and play around with the interactive api documentation at http://localhost:8000/api-documentation
![image](https://user-images.githubusercontent.com/364566/131185096-e3bc48f5-1140-4e3c-ae09-cd47fa4552a6.png)


## Resources

- [Getting Started Video (Demo) - EthDenver Hackathon 2020](https://www.youtube.com/watch?v=46nJ4AWHmvw) - outdated on build steps but still really useful resource
- [@open-rpc/generator package](https://www.npmjs.com/package/@open-rpc/generator)
- [example open-rpc documents](https://github.com/open-rpc/examples/tree/master/service-descriptions)

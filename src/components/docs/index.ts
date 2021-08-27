import * as path from "path";
import { move, ensureDir, remove } from "fs-extra";
import { components } from "@open-rpc/generator";
import * as fs from "fs";
import { promisify } from "util";
import { template } from "lodash";
import { ContentDescriptorObject, ExamplePairingObject, ExampleObject, MethodObject } from "@open-rpc/meta-schema";
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const access = promisify(fs.access);

const indexTemplate = template(`import React, { useEffect } from "react";
import { Grid, Typography, Box, Button } from "@material-ui/core";
import { Link as GatsbyLink } from "gatsby";
import Link from "@material-ui/core/Link";
import { grey } from "@material-ui/core/colors";

const MyApp: React.FC = () => {
  return (
    <>
      <Grid container alignContent="center" alignItems="center" justify="center" direction="column">
<img className="logo" alt="logo" src={"https://camo.githubusercontent.com/bc04ec4cd12a232ee902ce0c0344098ad854e80d/68747470733a2f2f6d69726f2e6d656469756d2e636f6d2f6d61782f313439322f312a337256307a30756654716b474334524a3376585177412e706e67"} style={{ paddingTop: "10%", width: "500px" }} />
        <br/>
        <Typography variant="h1"><%= openrpcDocument.info.title %></Typography>
        <Typography gutterBottom style={{ paddingTop: "100px", paddingBottom: "20px" }} variant="inherit">
          <%= openrpcDocument.info.description %>
        </Typography>
        <br/>
        <Button variant="contained" color="primary" href="/api-documentation">
          Plugin Documentation
        </Button>
        <br />
        <br />
        <br />
      </Grid>
    </>
  );
};

export default MyApp;
`);

const docsTemplate = template(`import React, { useEffect, useState } from "react";
import { EventEmitter } from "events";
import { useStaticQuery, graphql } from "gatsby";
import Documentation from "@open-rpc/docs-react";
import useDarkMode from "use-dark-mode";
import "./api-documentation.css";
import InspectorPlugin from "../docs-react-plugins";
import Inspector from "@open-rpc/inspector";
import * as monaco from "monaco-editor";
import { Button, Grid, Typography, InputBase, Container, Tab, Tabs, IconButton, Tooltip, Dialog, DialogTitle, DialogActions, DialogContent, Avatar } from "@material-ui/core";
import ExpandMore from "@material-ui/icons/ExpandMore";
import ExpandLess from "@material-ui/icons/ExpandLess";
import Warning from "@material-ui/icons/Warning";
import PlaygroundSplitPane from "../components/PlaygroundSplitPane";
const $RefParser = require("@apidevtools/json-schema-ref-parser"); //tslint:disable-line
import { useTheme } from "@material-ui/core/styles";
import useInspectorActionStore from "../stores/inspectorActionStore";
import { OpenrpcDocument } from "@open-rpc/meta-schema";

interface RequestArguments {
  readonly method: string;
  readonly params?: readonly unknown[] | object;
}

interface EthereumProvider extends EventEmitter {
  isMetaMask?: boolean;
  request: (args: RequestArguments) => Promise<unknown>;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const ApiDocumentation: React.FC = () => {
  if (typeof window === "undefined") {
    return null;
  }
  const currentTheme = useTheme();
  const [horizontalSplit, setHorizontalSplit] = useState(false);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [inspectorContents] = useInspectorActionStore<any>();

  useEffect(() => {
    if (inspectorContents) {
      setHorizontalSplit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectorContents]);

  useEffect(() => {
    const hasEthereum = window.ethereum && window.ethereum.isMetaMask;
    setShowInstallDialog(!hasEthereum);
  }, [window.ethereum])

  const darkmode = useDarkMode();
  useEffect(() => {
    const t = darkmode.value ? "vs-dark" : "vs";
    if (monaco) {
      monaco.editor.setTheme(t);
    }
    setReactJsonOptions({
      ...reactJsonOptions,
      theme: darkmode.value ? "summerfruit" : "summerfruit:inverted",
    });
  }, [darkmode.value]);

  const [reactJsonOptions, setReactJsonOptions] = useState({
    theme: "summerfruit:inverted",
    collapseStringsAfterLength: 25,
    displayDataTypes: false,
    displayObjectSize: false,
    indentWidth: 2,
    name: false,
  });

  const openrpcQueryData = useStaticQuery(graphql\`
    query {
      openrpcDocument {
        id
        openrpcDocument
      }
    }
  \`);
  const [openrpcDocument, setOpenrpcDocument] = useState<OpenrpcDocument>();
  const [inspectorUrl, setInspectorUrl] = useState<string>("wallet_plugin_http://localhost:8081/package.json");
  const [methodFromUrl, setMethodFromUrl] = useState<string>(window.location.hash.substring(1));
  const [uiSchema, setUiSchema] = useState<any>({
    params: {},
    methods: {},
    contentDescriptors: { "ui:hidden": true }
  });

  useEffect(() => {
    if (openrpcQueryData.openrpcDocument) {
      $RefParser.dereference(JSON.parse(openrpcQueryData.openrpcDocument.openrpcDocument)).then(setOpenrpcDocument);
    }
  }, [openrpcQueryData]);

  useEffect(() => {
    if (!openrpcDocument) {
      return;
    }
    if (openrpcDocument.servers && openrpcDocument.servers[0]) {
      setInspectorUrl(openrpcDocument.servers[0].url);
    }
  }, [openrpcDocument]);

  useEffect(() => {
    setTimeout(() => { // defer scrollTo to get elementById
      if (methodFromUrl && methodFromUrl.length) {
        const wrapper = document.getElementsByClassName("left-split")[0];
        const el = document.getElementById(methodFromUrl);
        if (el && wrapper) {
          el.scrollIntoView();
          wrapper.scrollBy(0, -100);
        }
      }
    });
  }, [methodFromUrl])

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash) {
      setMethodFromUrl(hash);
      setUiSchema({
        params: {},
        methods: {
          "ui:defaultExpanded": {
            [hash]: true
          },
        },
        contentDescriptors: { "ui:hidden": true }
      });
    }
  }, []);

return (
  <>
    <PlaygroundSplitPane
      direction="horizontal"
      split={horizontalSplit}
      splitLeft={true}
      leftStyle={{
        paddingTop: "64px",
        width: "100%",
        height: "100%",
        overflowY: "auto",
      }}
      rightStyle={{
        width: "100%",
        height: "100%",
      }}
      right={
        <Inspector
          url={inspectorUrl}
          customTransport={{
            type: "plugin",
            name: "Snaps",
            transport: {
              type: "postmessageiframe",
            },
            uri: "https://xops.github.io/inspector-snaps-transport",
          }}
          hideToggleTheme={true}
          openrpcDocument={openrpcDocument}
          darkMode={darkmode.value}
          request={inspectorContents && inspectorContents.request}
        />
      }
      left={
        <>
          <Container>
            <Documentation
              uiSchema={uiSchema}
              onMethodToggle={(method: string, expanded: boolean) => {
                if (expanded) {
                  window.history.pushState(null, method, '#' + method);
                }
              }}
              key={JSON.stringify(uiSchema)}
              methodPlugins={[InspectorPlugin]}
              reactJsonOptions={reactJsonOptions}
              schema={openrpcDocument || {} as any}
            />
            <div style={{ marginBottom: "20px" }} />
          </Container>
          <Tabs
            variant="scrollable"
            indicatorColor="primary"
            value={0}
            style={{ position: "absolute", bottom: "0", right: "25px", zIndex: 1, marginBottom: "0px" }}
          >
            <Tab
              onClick={() => setHorizontalSplit(!horizontalSplit)}
              style={{
                background: currentTheme.palette.background.default,
                width: "165px",
                paddingRight: "30px",
                border: "1px solid " + currentTheme.palette.text.hint,
              }}
              label={
                <div>
                  <Typography
                    variant="body1"><span role="img" aria-label="inspector">🕵️‍♂️</span>️ Inspector</Typography>
                  <Tooltip title="Toggle Inspector">
                    <IconButton style={{ position: "absolute", right: "5px", top: "20%" }} size="small">
                      {horizontalSplit
                        ? <ExpandMore />
                        : <ExpandLess />
                      }
                    </IconButton>
                  </Tooltip>
                </div>
              }>
            </Tab>
          </Tabs>
        </>
      }>
    </PlaygroundSplitPane>
    <Dialog open={showInstallDialog} onClose={() => setShowInstallDialog(false)}>
      <DialogTitle>
        <div style={{ display: "flex" }}>
          <div style={{ marginTop: "6px", marginLeft: "6px" }}>
            <Warning />
          </div>
          <Typography variant="h5" style={{ marginTop: "8px", marginLeft: "6px" }}>
            MetaMask Not Detected
            </Typography>
        </div>
      </DialogTitle>
      <DialogContent dividers>
        <Typography>Install MetaMask for your platform and refresh the page.</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
        <Button startIcon={<Avatar src={"https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg"} style={{ opacity: "0.9", height: "24px", width: "24px" }} />} variant="contained" color="primary" href="https://metamask.io/download.html" target="_blank">Download MetaMask</Button>
      </DialogActions>
    </Dialog>
  </>
);

};

export default ApiDocumentation;
`);

const gatsbyConfigTemplate = template(`
const emoji = require("remark-emoji");

module.exports = {
  pathPrefix: "/pristine-typescript-gatsby-react-material-ui",
  siteMetadata: {
    title: '<%= openrpcDocument.info.title %>',
    description: '<%= openrpcDocument.info.description %>',
    logoUrl: 'https://camo.githubusercontent.com/bc04ec4cd12a232ee902ce0c0344098ad854e80d/68747470733a2f2f6d69726f2e6d656469756d2e636f6d2f6d61782f313439322f312a337256307a30756654716b474334524a3376585177412e706e67',
    primaryColor: '#3f51b5', //material-ui primary color
    secondaryColor: '#f50057', //material-ui secondary colo
    author: '',
    menuLinks: [
      {
        name: 'home',
        link: '/',
        ignoreNextPrev: true
      },
      {
        name: 'API Documentation',
        link: '/api-documentation'
      }
    ],
    footerLinks: [
      {
        name: 'OpenRPC Specification',
        link: 'https://github.com/open-rpc/spec'
      }
    ]
  },
  plugins: [
    '@xops.net/gatsby-openrpc-theme',
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: 'pristine-site',
        short_name: 'pristine-site',
        start_url: '/',
        background_color: 'transparent',
        theme_color: '#3f51b5',
        display: 'minimal-ui',
        icon: 'src/images/gatsby-icon.png', // This path is relative to the root of the site.
      },
    }
  ],
}
`);

const hooks: components.IHooks = {
  afterCopyStatic: [
    async (dest, frm, component, openrpcDocument) => {
      const destPath = path.join(dest, "package.json");
      const tmplPath = path.join(dest, "_package.json");

      const tmplPkgStr = await readFile(tmplPath, "utf8");
      let tmplPkg = JSON.parse(tmplPkgStr);

      tmplPkg.name = component.name || openrpcDocument.info.title;
      tmplPkg.version = openrpcDocument.info.version;

      let currPkgStr;
      try {
        currPkgStr = await readFile(destPath, "utf8");
        const currPkg = JSON.parse(currPkgStr);
        tmplPkg = {
          ...currPkg,
          ...tmplPkg,
          dependencies: {
            ...currPkg.dependencies,
            ...tmplPkg.dependencies,
          },
          devDependencies: {
            ...currPkg.devDependencies,
            ...tmplPkg.devDependencies,
          },
        };
      } catch (e) {
        // do nothing
      }

      await writeFile(destPath, JSON.stringify(tmplPkg, undefined, "  "));
      await remove(tmplPath);
    },
  ],
  templateFiles: {
    docs: [
      {
        path: "src/pages/index.tsx",
        template: indexTemplate,
      },
      {
        path: "src/pages/api-documentation.tsx",
        template: docsTemplate,
      },
      {
        path: "gatsby-config.js",
        template: gatsbyConfigTemplate,
      },
    ],
  },
};


const docsComponent: components.IComponentModule = {
  hooks,

  staticPath: (language: string, type?: string)=> {
    if(!type || type?.search("nostatic") > -1) return undefined
    return path.resolve(__dirname, '..', '..', 'templates/docs/');
  },

}

export default docsComponent;

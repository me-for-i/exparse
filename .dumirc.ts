import { defineConfig } from 'dumi';

export default defineConfig({
  outputPath: 'docs-dist',
  title: 'Exparser',
  favicons: [
    'https://resources.miotech.com/images/icons/favicon-light.ico',
  ],
  logo: 'https://resources.miotech.com/static/landing-page/images/brand-logo-2021-cn-72782f.png',
  themeConfig: {
    // nav: [{
    //   title: 'Parser',
    //   link: '/components/parser'
    // }, {
    //   title: 'Editor',
    //   link: '/components/editor'
    // }],
    // sidebar: {
    //   '/components': [
    //     {
    //       title: 'Components',
    //       children: [{
    //         title: 'Parser',
    //         link: '/components/parser'
    //       }]
    //     }
    //   ],
    //   '/utils': [
    //     {
    //       title: 'Utils',
    //       children: [{
    //         title: 'Editor',
    //         link: '/components/editor'
    //       }]
    //     }
    //   ]
    // },
    footer: false,
    showLineNum: true,
    prefersColor: {
      default: 'auto',
      switch: true,
    }
  },
});

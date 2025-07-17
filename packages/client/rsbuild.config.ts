import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginTypeCheck({
      enable: false, // Enable in production builds only for performance
    }),
  ],
  source: {
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.REACT_APP_API_URL': JSON.stringify(
        process.env.REACT_APP_API_URL || 
        process.env.SERVER_URL || 
        `http://localhost:${process.env.SERVER_PORT || 3001}`
      ),
      'process.env.REACT_APP_WS_URL': JSON.stringify(
        process.env.REACT_APP_WS_URL || 
        process.env.WS_URL || 
        `ws://localhost:${process.env.WS_PORT || process.env.SERVER_PORT || 3001}`
      ),
      'process.env.REACT_APP_PROJECT_PATH': JSON.stringify(
        process.env.REACT_APP_PROJECT_PATH || 
        process.env.CAM_PROJECT_PATH || 
        '/default/project'
      ),
    },
    entry: {
      index: './src/index.tsx',
    },
  },
  html: {
    template: './public/index.html',
    title: 'Claude Agent Manager',
    meta: {
      viewport: 'width=device-width, initial-scale=1.0',
      description: 'Real-time monitoring dashboard for Claude Code agents',
    },
  },
  resolve: {
    alias: {
      '@': './src',
      '@components': './src/components',
      '@hooks': './src/hooks',
      '@utils': './src/utils',
      '@types': './src/types',
      '@stores': './src/stores',
      '@pages': './src/pages',
    },
  },
  server: {
    port: parseInt(process.env.CLIENT_PORT || '3000', 10),
    host: process.env.CLIENT_HOST || 'localhost',
    proxy: {
      '/api': {
        target: process.env.SERVER_URL || `http://localhost:${process.env.SERVER_PORT || 3001}`,
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
      },
    },
  },
  dev: {
    hmr: true,
    liveReload: true,
  },
  output: {
    distPath: {
      root: 'dist',
      js: 'static/js',
      css: 'static/css',
      svg: 'static/svg',
      font: 'static/font',
      image: 'static/image',
      media: 'static/media',
      html: '',
    },
    filename: {
      js: '[name].[contenthash:8].js',
      css: '[name].[contenthash:8].css',
    },
    cleanDistPath: true,
  },
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
    },
  },
  tools: {
    postcss: (config) => {
      config.plugins?.push(require('tailwindcss'), require('autoprefixer'));
      return config;
    },
  },
  environments: {
    web: {
      output: {
        target: 'web',
      },
    },
  },
});
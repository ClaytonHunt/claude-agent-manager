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
      'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || 'http://localhost:3001'),
      'process.env.REACT_APP_WS_URL': JSON.stringify(process.env.REACT_APP_WS_URL || 'ws://localhost:3001'),
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
    port: 3000,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
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
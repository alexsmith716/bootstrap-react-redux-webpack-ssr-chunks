const webpack = require('webpack');
const path = require('path');
const config = require('../config/config');

const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const Visualizer = require('webpack-visualizer-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
// const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const { clientConfiguration } = require('universal-webpack');
const settings = require('./universal-webpack-settings');
const configuration = require('./webpack.config');
const rootPath = path.resolve(__dirname, '..');

const ReactLoadablePlugin = require('react-loadable/webpack').ReactLoadablePlugin;

const bundleAnalyzerPath = path.resolve(configuration.context, './build/analyzers/bundleAnalyzer');
const visualizerPath = path.resolve(configuration.context, './build/analyzers/visualizer');
const assetsPath = path.resolve(configuration.context, './build/public/assets');
const serverPath = path.resolve(configuration.context, './build/server');

// reuseExistingChunk: allows to reuse existing chunks instead of creating a new one when modules match exactly.
// Chunks can be configured. There are 3 values possible "initial", "async" and "all". 
// When configured the optimization only selects initial chunks, on-demand chunks or all chunks.

// ==============================================================================================

function recursiveIssuer(m) {
  if (m.issuer) {
    return recursiveIssuer(m.issuer);
  } else if (m.name) {
    return m.name;
  } else {
    return false;
  }
}

// configuration.devtool = 'source-map';
// configuration.devtool = 'hidden-source-map'; // stack trace info only

configuration.stats = {
  // assets: true,
  // cached: true,
  // entrypoints: false,
  // children: false,
}

// https://babeljs.io/docs/en/next/babel-polyfill.html
configuration.entry.main.push(
  'bootstrap-loader',
  './client/index.js',
);

configuration.output.filename = '[name].[chunkhash].bundle.js';
configuration.output.chunkFilename = '[name].[chunkhash].chunk.js';
configuration.output.publicPath = config.publicPath;

configuration.module.rules.push(
  {
    test: /\.(scss)$/,
    use: [
      MiniCssExtractPlugin.loader,
      {
        loader: 'css-loader',
        options: {
          modules: true,
          localIdentName: '[name]__[local]__[hash:base64:5]',
          importLoaders: 3,
          // sourceMap: true,
        }
      },
      {
        loader: 'postcss-loader',
        options: {
          // sourceMap: true,
          config: {
            path: 'postcss.config.js'
          }
        }
      },
      {
        loader: 'sass-loader',
        options: {
          outputStyle: 'expanded',
          // sourceMap: true,
          // sourceMapContents: true
        }
      },
      {
        loader: 'sass-resources-loader',
        options: {
          resources: [
            path.resolve(configuration.context, 'client/assets/scss/app/functions.scss'),
            path.resolve(configuration.context, 'client/assets/scss/app/variables.scss'),
            path.resolve(configuration.context, 'client/assets/scss/app/mixins.scss'),
          ],
        },
      },
    ]
  },
  {
    test: /\.(css)$/,
    use: [
      MiniCssExtractPlugin.loader,
      {
        loader : 'css-loader',
        options: {
          modules: true,
          localIdentName: '[name]__[local]__[hash:base64:5]',
          importLoaders: 1,
          // sourceMap: true,
        }
      },
      {
        loader: 'postcss-loader',
        options: {
          // sourceMap: true,
          config: {
            path: 'postcss.config.js'
          }
        }
      },
    ]
  },
);

// optimization.minimize: ( false || true )
//    *** Tell webpack to minimize the bundle using the UglifyjsWebpackPlugin
//    *** This is true by default in production mode
//    *** if 'false', then minimize manually in a separate step

// While webpack 5 is likely to come with a CSS minimizer built-in,
// with webpack 4 you need to bring your own.
// To minify the output, use a plugin like optimize-css-assets-webpack-plugin.
// Setting optimization.minimizer overrides the defaults provided by webpack,
// so make sure to also specify a JS minimizer:

configuration.optimization = {
  minimizer: [
    new UglifyJsPlugin({
      // cache: false,      // Enable file caching (default: false)
      // parallel: false,   // Use multi-process parallel running to improve the build speed (default: false)
      // sourceMap: false, // Use source maps to map error message locations to modules (default: false)
      // extractComments: false, // Whether comments shall be extracted to a separate file (default: false)
      // uglifyOptions: {
      //   ecma: 8, // Supported ECMAScript Version (default undefined)
      //   warnings: false, // Display Warnings (default false)
      //   mangle: true, // Enable Name Mangling (default true)
      //   compress: {
      //     passes: 1,  // The maximum number of times to run compress (default: 1)
      //   },
      //   output: {
      //     beautify: true, // whether to actually beautify the output (default true)
      //     comments: false, // true or "all" to preserve all comments, "some" to preserve some (default false)
      //   },
      //   ie8: false, // Enable IE8 Support (default false)
      //   safari10: false, // Enable work around Safari 10/11 bugs in loop scoping and await (default false)
      // }
    }),
    new OptimizeCSSAssetsPlugin({
      // cssProcessor: require('cssnano'), // cssnano >>> default optimize \ minimize css processor 
      // cssProcessorOptions: { discardComments: { removeAll: true } }, // defaults to {}
      // canPrint: true, // indicating if the plugin can print messages to the console (default true)
    }),
  ],
  splitChunks: {
    chunks: 'async',
    minSize: 30000,
    minChunks: 1,
    maxAsyncRequests: 5,
    maxInitialRequests: 3,
    automaticNameDelimiter: '.',
    name: true,
    cacheGroups: {
      // styles: {
      //   name: 'main',
      //   test: (m,c,entry = 'main') => m.constructor.name === 'CssModule' && recursiveIssuer(m) === entry,
      //   // test: /\.(scss)$/,
      //   chunks: 'async',
      //   // chunks: 'all',
      //   enforce: true,
      // },
      vendor: {
        name: 'vendor',
        reuseExistingChunk: true,
        chunks: chunk => ['main',].includes(chunk.name),
        test: module => /[\\/]node_modules[\\/]/.test(module.context),
        minChunks: 1,
        minSize: 0,
      },
      // commons: {
      //   name: 'commons',
      // }
    },
    // splitChunks: {
    //   chunks: 'async',
    //   minSize: 30000,
    //   minChunks: 1,
    //   maxAsyncRequests: 5,
    //   maxInitialRequests: 3,
    //   automaticNameDelimiter: '.',
    //   name: true,
    //   cacheGroups: {
    //     vendor: {
    //       test: /[\\/]node_modules[\\/]/,
    //       priority: -10
    //     },
    //     default: {
    //       minChunks: 2,
    //       priority: -20,
    //       reuseExistingChunk: true
    //     }
    //   }
    // }
  },
  runtimeChunk: {
    name: 'manifest',
  },
  // runtimeChunk: true
  // occurrenceOrder: true,
};

// ==============================================================================================

configuration.plugins.push(

  new CleanWebpackPlugin([bundleAnalyzerPath,visualizerPath,assetsPath,serverPath], { root: configuration.context }),

  new MiniCssExtractPlugin({
    // filename: '[name].css',
    filename: '[name].[contenthash].css.css',
    // chunkFilename: '[name].[contenthash].chunk.css',
  }),

  new webpack.DefinePlugin({
    'process.env.NODE_ENV': '"production"',
    __CLIENT__: true,
    __SERVER__: false,
    __DEVELOPMENT__: false,
    __DEVTOOLS__: false,
    __DLLS__: false,
  }),

  new ReactLoadablePlugin({
    filename: path.join(configuration.output.path, 'loadable-chunks.json')
  }),

  new HtmlWebpackPlugin({
    filename: 'index.html',
    template: path.join(rootPath, './server/pwa.js'),
  }),

  // use service workers to cache external dependencies
  // generate 'service-worker.js' and add it to build directory

  // SWPrecacheWebpackPlugin is a webpack plugin for using service workers to cache your external project dependencies. 
  // It will generate a service worker file using sw-precache and add it to your build directory.

  // new SWPrecacheWebpackPlugin({

  //   cacheId: 'bootstrap-react-redux-webpack-ssr-two',
  //   filename: 'service-worker.js',
  //   maximumFileSizeToCacheInBytes: 8388608,

  //   staticFileGlobs: [path.dirname(configuration.output.path) + '/**/*.{js,html,css,png,jpg,gif,svg,eot,ttf,woff,woff2}'],

  //   stripPrefix: path.dirname(configuration.output.path),

  //   directoryIndex: '/',
  //   verbose: true,
  //   navigateFallback: '/assets/index.html',
  // }),

  // new Visualizer({
  //   filename: '../../analyzers/visualizer/bundle-stats.html'
  // }),

  new BundleAnalyzerPlugin({
    analyzerMode: 'static',
    reportFilename: '../../analyzers/bundleAnalyzer/client-development.html',
    // analyzerMode: 'server',
    // analyzerPort: 8888,
    // defaultSizes: 'parsed',
    openAnalyzer: false,
    generateStatsFile: false
  }),
);

// console.log('>>>>>>>>>>>>>>>>>>> WCCPB CLIENT configuration: ', configuration)
const configurationClient = clientConfiguration(configuration, settings)
// console.log('>>>>>>>>>>>>>>>>>>> WCCPB CLIENT configurationClient: ', configurationClient)

export default configurationClient;

const CopyPlugin = require("copy-webpack-plugin");
const path = require('node:path');

module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: path.resolve(__dirname, "index.html"), to: "../index.html" },
        { from: path.resolve(__dirname, "vote.html"), to: "../vote.html" },
        { from: path.resolve(__dirname, "images"), to: "../images" },
        { from: path.resolve(__dirname, "sound"), to: "../sound" },
      ],
      options: {
        concurrency: 100,
      },
    }),
  ],
  entry: [
    './src/vote.js',
    './src/app.js',
    './src/app.css',
    './src/season1.css',
  ],
  output: {
    path: `${__dirname}/dist/scripts`,
    publicPath: '/',
    filename: 'dist.js',
    clean: true,
  },
  devServer: {
    devMiddleware: {
      writeToDisk: true,
    },
    static: {
      directory: `${__dirname}/dist`
    }
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: 'style-loader',
      },
      {
        test: /\.css$/,
        loader: 'css-loader',
        options: {
          url: false,
        }
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
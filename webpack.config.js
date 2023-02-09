const CopyPlugin = require("copy-webpack-plugin");
const path = require('node:path');

module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: path.resolve(__dirname, "index.html"), to: "../index.html" },
        { from: path.resolve(__dirname, "vote.html"), to: "../vote.html" },
        { from: path.resolve(__dirname, "draft-table.html"), to: "../draft-table.html" },
        { from: path.resolve(__dirname, "images"), to: "../images" },
        { from: path.resolve(__dirname, "sound"), to: "../sound" },
      ],
      options: {
        concurrency: 100,
      },
    }),
  ],
  entry: {
    vote: './src/vote.js',
    app: './src/app.js',
    table: './src/draft-table.js',
    /*global_css: './src/app.css',
    glbal_css: './src/season1.css',    */
  },
  output: {
    path: `${__dirname}/dist/scripts`,
    publicPath: '/',
    filename: '[name].dist.js',
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
module.exports = {
  entry: [
    './src/vote.js',
    './src/app.js',
    './src/cards.js',
    './src/app.css',
  ],
  output: {
    path: `${__dirname}/dist`,
    publicPath: '/',
    filename: 'dist.js',
    clean: true,
  },
  devServer: {
    devMiddleware: {
      writeToDisk: true,
    },
    static: {
      directory: __dirname
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
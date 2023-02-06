module.exports = {
   
  entry: {
    vote: './src/vote.js',
    app: './src/app.js',
    table: './src/draft-table.js',
    /*global_css: './src/app.css',
    glbal_css: './src/season1.css',    */
  },
  output: {
    path: `${__dirname}/dist`,
    publicPath: '/',
    filename: '[name].dist.js',
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
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index.js'
  },
  module: {
    loaders: [
      {
        test: path.join(__dirname, 'public/src'),
        loader: 'babel-loader'
      }
    ]
  }
};

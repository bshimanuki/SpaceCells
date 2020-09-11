var HTMLWebpackPlugin = require('html-webpack-plugin');

var HTMLWebpackPluginConfig = new HTMLWebpackPlugin({
  template: __dirname + '/site/test.html',
  filename: 'test.html',
  inject: 'body',
});

module.exports = {
  entry: __dirname + '/site/test.jsx',
  output: {
    filename: 'bundle.js',
    path: __dirname + '/build'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.css/,
        exclude: /node_modules/,
        use: [
          'style-loader',
          'css-loader',
        ]
      },
      {
        test: /\.svg/,
        exclude: /node_modules/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              svgoConfig: {
                plugins: {
                  collapseGroups: false,
                },
              },
            },
          }
        ]
      },
    ],
  },
  plugins: [HTMLWebpackPluginConfig],
};
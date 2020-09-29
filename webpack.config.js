var HTMLWebpackPlugin = require('html-webpack-plugin');

var HTMLWebpackPluginConfig = new HTMLWebpackPlugin({
  template: __dirname + '/site/index.html',
  filename: 'index.html',
  inject: 'body',
});

module.exports = {
  entry: __dirname + '/site/inject.jsx',
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
        test: /embindings\.wasm$/,
        type: 'javascript/auto',
        loader: 'file-loader',
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [
          'style-loader',
          'css-loader',
        ]
      },
      {
        test: /\.(txt|lvl)$/,
        exclude: /node_modules/,
        loader: 'raw-loader',
      },
      {
        test: /\.svg$/,
        exclude: /node_modules/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              svgoConfig: {
                plugins: {
                  collapseGroups: false,
                  removeUselessStrokeAndFill: false,
                },
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [HTMLWebpackPluginConfig],
};

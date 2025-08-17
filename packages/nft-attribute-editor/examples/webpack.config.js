const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    'gods': './gods/index.ts',
    'sparrows': './sparrows/index.ts',
    'kcd-kongz': './kcd-kongz/index.ts',
    'babyping': './babyping/index.ts',
  },
  output: {
    filename: '[name]/dist/bundle.js',
    path: path.resolve(__dirname, './'),
    chunkFormat: false
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader, {
            loader: "css-loader",
            options: {
              url: false,
            },
          }
        ]
      },
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: 'styles.css' }),
  ],
  devServer: {
    client: {
      overlay: false,
      logging: 'none'
    },
    open: true
  }
};
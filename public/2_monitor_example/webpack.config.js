const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  context: process.cwd(),
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'monitor.js',
  },
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    open: true,
    setupMiddlewares: (middlewares) => {
      middlewares.unshift({
        name: 'success',
        path: '/success',
        middleware: (req, res) => {
          res.json({ id: 1 });
        },
      });
      middlewares.unshift({
        name: 'error',
        path: '/error',
        middleware: (req, res) => {
          res.sendStatus(500);
        },
      });
      return middlewares;
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      inject: 'head',
      scriptLoading: 'blocking',
    }),
  ],
};

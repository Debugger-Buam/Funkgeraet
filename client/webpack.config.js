const path = require("path");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: "./src/main.ts",
  plugins: [new MiniCssExtractPlugin()],
  module: {
    rules: [
      // https://webpack.js.org/loaders/sass-loader/#getting-started
      {
        test: /\.s[ac]ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          "sass-loader"
        ],
      },
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  devtool: "source-map",
  mode: "development",
  output: {
    path: path.resolve(__dirname, "dist/js"),
    filename: "bundle.js",
  },
  optimization: {
    minimizer: [
      new CssMinimizerPlugin(),
      new TerserPlugin()
    ]
  },
  devServer: {
    contentBase: [path.resolve(__dirname, "static")],
    open: true,
    watchContentBase: true,
    publicPath: "/",
    historyApiFallback: true,
  },
};

const path = require('path');

module.exports = {
    entry: './src/main.ts',
    module: {
        rules: [ // https://webpack.js.org/loaders/sass-loader/#getting-started
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    'style-loader',
                    // Translates CSS into CommonJS
                    'css-loader',
                    // Compiles Sass to CSS
                    'sass-loader',
                ],
            }
        ],
    },
    devtool: 'source-map',
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'dist/js'),
        filename: 'bundle.js'
    },
    devServer: {
        contentBase: [path.resolve(__dirname, 'static')],
        open: true,
        watchContentBase: true
    }
};

const path = require('path');

module.exports = {
    entry: './src/main.ts',
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

module.exports = {
    entry: './src/main.ts',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.ts']
    },
    output: {
        path: `${__dirname}/dist/js`,
        publicPath: 'js/',
        filename: 'main.js'
    },
    devServer: {
        contentBase: [`${__dirname}/dist`, `${__dirname}/static/`],
        //publicPath: 'build/',
        //open: true,
        //port: 4001,
        //disableHostCheck: true,
        //watchContentBase: true
    },
    optimization: {
        minimize: false
    },
    mode: 'development'
};

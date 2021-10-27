var path = require("path");
var fs = require("fs");
var webpack = require("webpack");
const WebpackAssetsManifest = require('webpack-assets-manifest');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

function resolve(filePath) {
    return path.join(__dirname, filePath)
}

// options to pass to babel-loader.
// it is more complex because it needs to support typescript.
var babelOptions = {
    presets: [
        "@babel/react",
        ["@babel/typescript", {
            isTSX: true,
            allExtensions: true
        }],
        ["@babel/env", {
            "targets": {
                "browsers": [
                    "last 2 chrome versions, last 2 firefox versions, last 2 opera versions, last 2 FirefoxAndroid versions, last 2 ChromeAndroid versions"
                ]
            },
            "modules": false
        }]
    ],
    plugins: [
        "@babel/transform-runtime",
        ["@babel/plugin-proposal-decorators", { "legacy": false, decoratorsBeforeExport: false }],
        ["@babel/proposal-class-properties", { loose: true }],
        ["@babel/plugin-proposal-private-property-in-object", { "loose": true }],
        "@babel/proposal-object-rest-spread",
        "@babel/plugin-transform-typescript"
    ]
};

const isDevelopment = process.env.NODE_ENV !== "production";
var isProduction = !isDevelopment
const apiPort = 5051;
const webpackDevserverPort = 3051;
const publicDir = "./public";
const outDir = '../out/wwwroot';
console.log("Bundling for " + (isProduction ? "production" : "development") + "...");

module.exports = {
    cache: {
        type: 'filesystem'
    },
    //devtool: isProduction ? "source-map" : "eval-source-map",
    entry: {
        main: resolve('./src/index.tsx')
    },
    mode: isProduction ? "production" : "development",
    output: {
        path: resolve(outDir),
        publicPath: "/",
        // the .ix. is code for immutable files.
        // the web server will set Cache-Control: immutable for these files.
        filename: isProduction ? "static/js/[name].[contenthash:8].ix.js" : "static/js/[name].js",
        chunkFilename: 'static/js/[id].js',
        hotUpdateChunkFilename: 'static/js/[id].[fullhash].hot-update.js',
        hotUpdateMainFilename: 'static/js/[runtime].[fullhash].hot-update.json',
        assetModuleFilename: 'static/[hash][ext][query]',
        globalObject: 'this',
        clean: true,
    },
    resolve: {
        symlinks: true,
        extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    optimization: {
        //runtimeChunk: 'single',

        // Split the code coming from npm packages into a different file.
        // 3rd party dependencies change less often, let the browser cache them.
        //splitChunks: {
        //    cacheGroups: {
        //        commons: {
        //            test: /node_modules|\.nuget|\.fable/,
        //            name: "vendors",
        //            chunks: "all"
        //        }
        //    }
        //},
        //minimizer: isProduction ? [new MinifyPlugin()] : []
    },
    devServer: {
        devMiddleware: {
            index: 'index.html',
            // required because ebos-yc-webserver reads index.html
            writeToDisk: true,
        },
        static: {
            directory: resolve(publicDir),
        },
        historyApiFallback: true,
        hot: true,
        // enable external access
        host: '0.0.0.0',
        allowedHosts: "all",
        client: { overlay: true, progress: true, logging: "info" },
        port: webpackDevserverPort,
        //https: {
        //    key: fs.readFileSync(resolve('./server.key')),
        //    cert: fs.readFileSync(resolve('./server.cert')),
        //},
        open: true
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: "ts-loader",
                    options: {
                        projectReferences: true
                    }
                }
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: { /*cacheDirectory: true, cacheCompression: false,*/ ...babelOptions },
                },
            },

            {
                test: /\.less$/,
                use: [
                    //isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
                    MiniCssExtractPlugin.loader,

                    'css-loader',
                    'less-loader'
                ],
            },

            {
                test: /\.css$/,
                use: [
                    //isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
                    MiniCssExtractPlugin.loader,

                    'css-loader'
                ],
            },

            {
                test: /\.(sa|sc)ss$/,
                use: [
                    //isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
                    MiniCssExtractPlugin.loader,

                    'css-loader',
                    //'postcss-loader',
                    'sass-loader'
                ],
            },

            // https://webpack.js.org/guides/asset-management/#loading-images
            {
      
              test: /\.(png|svg|jpg|jpeg|gif)$/i,      
              type: 'asset/resource',
            },

            // need the "fullySpecified": https://github.com/webpack/webpack/issues/11467#issuecomment-691873586
            {
                test: /\.m?js/,
                resolve: {
                    fullySpecified: false
                }
            }
        ]
    },
    plugins: [
        //new webpack.debug.ProfilingPlugin(),
        new WebpackAssetsManifest({
            writeToDisk: isProduction
        }),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: isDevelopment ? 'static/css/[name].css' : 'static/css/[name].[hash].ix.css',
            chunkFilename: isDevelopment ? 'static/css/[id].css' : 'static/css/[id].[hash].ix.css',
        }),
        new HtmlWebpackPlugin({ publicPath: '.', template: resolve('./index.template.html'), filename: "index.html", chunks: ['main'] }),
        new CopyPlugin({
            patterns: [
                { from: resolve("public") },
                // { from: "other", to: "public" },
            ],
        }),
    ].filter(Boolean)
};

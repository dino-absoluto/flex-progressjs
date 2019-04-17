/**
 * @author Dino <dinoabsoluto+dev@gmail.com>
 * @license
 * Copyright 2019 Dino <dinoabsoluto+dev@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
/* imports */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const nodeExternals = require('webpack-node-externals')
const merge = require('lodash/merge')
const webpack = require('webpack')
const BundleAnalyzerPlugin =
  require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const setupTypescript = (env) => ({
  devtool: 'source-map',
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            experimentalWatchApi: true,
            compilerOptions: {
              removeComments: !!env.prod
            }
          }
        }
      }, {
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre'
      }
    ]
  },
  externals: [
    nodeExternals({
      whitelist: [ /^lodash/ ]
    })
  ]
})

const setupProductionMode = (env) => !env.prod ? ({
  mode: 'development',
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false
  }
}) : ({
  mode: 'production'
})

const setupAnalyzeBundle = (env) => env.analyzeBundle ? ({
  plugins: [
    new BundleAnalyzerPlugin()
  ]
}) : {}

const configLib = (env) => ({
  target: 'node',
  entry: './src/index.ts',
  output: {
    pathinfo: false,
    filename: 'index.js',
    libraryTarget: 'commonjs',
    path: path.resolve(__dirname, env.prod ? 'lib' : '__tmp__/lib')
  }
})

module.exports = (env = {}) => {
  const lib = merge({}
    , configLib(env)
    , setupTypescript(env)
    , setupProductionMode(env)
    , setupAnalyzeBundle(env)
  )
  return lib
}

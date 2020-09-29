const path = require('path')

module.exports = ({ config }) => {
  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    loader: require.resolve('babel-loader'),
    options: {
      presets: [require.resolve('babel-preset-react-app')],
    },
  })

  config.resolve.extensions.push('.ts', '.tsx')

  config.resolve.modules = [...(config.resolve.modules || []), path.resolve(__dirname, '../')]

  // required to bundle MDX
  config.node = {
    ...config.node,
    fs: 'empty',
  }
  return config
}

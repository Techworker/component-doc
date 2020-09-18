const path = require('path');

module.exports = (chainableWebpackConfig, config) => {
    return chainableWebpackConfig.module
        .rule('vue')
        .use('component-doc')
        .loader(path.resolve(__dirname, 'src/loader.js'))
        .options(config)
        .end();
};
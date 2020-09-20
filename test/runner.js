const test = require('ava');
const fs = require('fs');
const vueComponentDocLoader = require('../src/loader');

function runFixtureFolder(folder) {
    const fixtureFiles = fs.readdirSync(__dirname + '/fixtures/' + folder);
    for (let i = 0; i < fixtureFiles.length; i++) {
        runFixtureFile(__dirname + '/fixtures/' + folder + '/' + fixtureFiles[i], folder);
    }
}

function runFixtureFile(file, group = 'unknown') {
    const r = fs.readFileSync(file);
    const splitted = r.toString().split("\n---\n");

    test('[' + group + '] ' + splitted[0], async assert => {
        // empty query
        let localConfig = JSON.parse(splitted[1]);
        localConfig.component = 'vue-component-doc-test';

        global.query = '?' + JSON.stringify(localConfig);
        const text = await vueComponentDocLoader(splitted[2]);
        assert.deepEqual(text, splitted[3]);
        assert.true(true);
    });
}

module.exports = {
    runFixtureFolder,
    runFixtureFile
}
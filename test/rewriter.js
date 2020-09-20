const test = require('ava');
const fs = require('fs');
const vueComponentDocLoader = require('../src/loader');

const fixtureFiles = fs.readdirSync(__dirname + '/fixtures/options');
for(let i = 0; i < fixtureFiles.length; i++) {

    const r = fs.readFileSync(__dirname + '/fixtures/options/' + fixtureFiles[i]);
    const splitted = r.toString().split("\n---\n");

    test(splitted[0], async assert => {
        // empty query
        global.query = '?' + splitted[1];
        const text = await vueComponentDocLoader(splitted[2]);
        assert.deepEqual(text, splitted[3]);
        assert.true(true);
    });
};

function traverseDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            console.log(fullPath);
            traverseDir(fullPath);
        } else {
            console.log(fullPath);
        }
    });
}
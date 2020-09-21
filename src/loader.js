const { Duplex } = require("stream");
const { getOptions } = require("loader-utils");

const getRewriter = require("./rewriter");

/**
 * A webpack loader that will transform a special tag and it's contents
 * to a vue component.
 *
 * @param source
 * @param map
 * @param meta
 * @returns {Promise<*>}
 */
module.exports = async function(source, map, meta) {
    return new Promise((resolve, reject) => {
        const resolveLoader = this.async ? this.async() : null;

        let options = getOptions(this);

        options.tag = options.tag || 'vue-component-usage';

        // check if this file contains the tag we want to transform
        if (source.indexOf(options.tag) === -1) {
            if(resolveLoader !== null) {
                resolveLoader(null, source, map, meta);
            } else {
                resolve(source);
            }

            return;
        }

        // set proper defaults
        options.debug = options.debug !== undefined ? !!options.debug : false;
        options.component = options.component || 'vue-component-usage-test';
        options.codeSlot = options.codeSlot || 'code';
        options.resultSlot = options.resultSlot || 'result';
        options.language = options.language || 'html';
        options.dedent = options.dedent !== undefined ? !!options.dedent : true;
        options.trim = options.trim !== undefined ? !!options.trim : true;
        options.omitCodeSlot = options.omitCodeSlot !== undefined ? !!options.omitCodeSlot : false;
        options.omitResultSlot = options.omitResultSlot !== undefined ? !!options.omitResultSlot : false;

        const chunks = [];
        const stream = Duplex.from(source).pipe(getRewriter(options));
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", (error) => {
            if (resolveLoader !== null) {
                resolveLoader(error);
            } else {
                reject(error);
            }
        });
        stream.on("end", () => {
            let result = chunks.join("").replace(/(v-slot:(.*?)="")/gm, "v-slot:$2");

            if (resolveLoader !== null) {
                resolveLoader(null, result, map, meta);
            } else {
                resolve(result);
            }
        });
    });
}
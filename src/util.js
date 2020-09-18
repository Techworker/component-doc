/**
 * A small function to escape html.
 *
 * @see https://stackoverflow.com/a/6234804/1470607
 * @param {String} unsafe
 * @returns {string}
 */
function escapeHtml(unsafe) {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Tries to extract an attribute from a list of attributes.
 *
 * When the attribute name is found and its value is either (string)'true' or
 * (string)'1' this method will return true, otherwise false.
 *
 *
 *
 * @param {Array.<{name: String, value: String}>} attrs
 * @param {String} name
 * @param {Boolean} defaultValue
 * @returns {Boolean}
 */
function extractBooleanOptionAttr(attrs, name, defaultValue) {
  const value = extractOptionAttr(attrs, name, defaultValue);
  if(value !== defaultValue) {
    return value === 'true' || value === '1';
  }

  return false;
}

/**
 * Tries to extract the value of an attribute from a list of attributes.
 *
 * @param {Array.<{name: String, value: String}>} attrs
 * @param {String} name
 * @param {*} defaultValue
 * @returns {*}
 */
function extractOptionAttr(attrs, name, defaultValue) {
  const attr = attrs.find((v) => { return v.name === name; });
  if(attr !== undefined) {
    return attr.value;
  }

  return defaultValue;
}

module.exports = {
  escapeHtml,
  extractOptionAttr,
  extractBooleanOptionAttr,
};


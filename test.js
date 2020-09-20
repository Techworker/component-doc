var str = '<test v-slot:abc="">hallo=""<a v-slot:abc="">hallo=""</a></test>';
var res = str.replace(/(v-slot:(.*?)="")/gm, "v-slot:$2");
var a = str.match(/v-slot:(.*?="")/gm);
document.write(res);
const Plugin = require("../lib/plugin");

const delim = "or";
const trigger = new RegExp(`^!decide\\s(?!.*${delim}\\s${delim}).+?\\s${delim}\\s(?!.*\\s${delim}).+`);

const flavorful = false;

const flavor = {
  prefixes: [
    "In my opinion, ",
    "I think ",
    "Probably ",
    "Certainly ",
    "",
    "In this situation, ",
    "I'm not a 100% sure, but "
  ],
  suffixes: [
    " is a good choice.",
    " is the best choice.",
    " could work.",
    ".",
    " for sure.",
  ]
}

function payload(src, msg, type){
  const items = msg.replace(/^!decide\s/, "").split(" or ");
  let chosen = pickRandom(items);

  if(flavorful){
    let pre = pickRandom(flavor.prefixes);
    let suf = pickRandom(flavor.suffixes);
    chosen = `${pre}'${chosen}'${suf}`;
  }

  return new Promise(res => res(new Plugin.Response(chosen)));
}

function pickRandom(arr){
  return arr.length ? arr[Math.random() * arr.length | 0] : undefined;
}

module.exports = new Plugin("decide", trigger, payload, "", 5, true, false, true)

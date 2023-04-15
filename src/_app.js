require('dotenv').config();
const { main } = require('./main');
const { generateBackgroundData } = require('./stockmarket');
const { calculation } = require('./Comparer');
const { pushDispatch } = require("./dispatch");

(async () => {
  await generateBackgroundData();
  //await pushDispatch('It\'ll work this time I swear');
})();

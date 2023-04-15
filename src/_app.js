require('dotenv').config();
const { main } = require('./main');
const { fetchBackgroundData } = require('./stockmarket');
const { calculation } = require('./Comparer');
const { pushDispatch } = require("./dispatch");

(async () => {
  await fetchBackgroundData();
  //await pushDispatch('It\'ll work this time I swear');
})();

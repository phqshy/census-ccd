require('dotenv').config();
//const { main } = require('./main');
//const { stockmarketfunc } = require('./stockmarket');
const { pushDispatch } = require("./dispatch");

(async () => {
  await pushDispatch();
})();

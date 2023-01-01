const axios = require('axios');
const stockprice = require('./const/stockprice.json');
const census = require('./const/census');
const backgroundData = require('./const/StockMarketBackGroundData.json');
const secrets = require('../secrets/secrets.json');
const { parseXml } = require("./services/helpers/parseXml");
const { getRegionalCensusData } = require("./services/fetchers/region");

/*
  HOW TO DO THIS:
  - loop through stockprice.json to find the entry with the correct date (the last one most likely)
  - loop through StockMarketBackGroundData.json to find the entry with the correct date (the last one most likely)
  - get date from stockprice.date prop
  - generate overview data:
      - Round inflation to nearest 0.1
      - Round employment and tax to nearest 0.01
      - Round scientific advancement and economy to nearest 0.001
  - generate stock data:
      - round stock price to nearest 0.001
 */

const latestStockPrices = stockprice[stockprice.length - 1];
const latestBackgroundData = backgroundData[backgroundData.length - 1][0];

/**
 * Fetches dispatch data from files in ./const and posts them to NationStates as a dispatch. This will create a new dispatch!
 * This method requires secrets/secrets.json placed in the root project directory, with a nation and password property
 * @param {string} news optional fiscal news for the "Market News" section
 * @return {Promise<void>}
 */
async function pushDispatch(news = ''){
  const fullText = await generateDispatchHeader(news) + generateStockTable() + generateFooter();

  let params = new URLSearchParams();
  params.append("nation", `${secrets.nation}`);
  params.append("c", "dispatch");
  params.append("dispatch", "add");
  params.append("title", "Confederation Stock Market");
  params.append("text", fullText);
  params.append("category", "5");
  params.append("subcategory", "515");
  params.append("mode", "prepare");

  const prepare = await axios.post('https://www.nationstates.net/cgi-bin/api.cgi', params, {
    headers: {
      "x-autologin": `${secrets.password}`,
      "User-Agent": "the Yeetusa (the.yeetusa@gmail.com)",
      "Content-Type": "application/x-www-form-urlencoded"
    },
  });

  const token = parseXml(prepare.data).NATION.SUCCESS;

  params = new URLSearchParams();
  params.append("nation", `${secrets.nation}`);
  params.append("c", "dispatch");
  params.append("dispatch", "add");
  params.append("title", "Confederation Stock Market");
  params.append("text", fullText);
  params.append("category", "5");
  params.append("subcategory", "515");
  params.append("mode", "execute");
  params.append("token", token);

  const execute = await axios.post('https://www.nationstates.net/cgi-bin/api.cgi', params, {
    headers: {
      "x-pin": `${prepare.headers['x-pin']}`,
      "User-Agent": "the Yeetusa (the.yeetusa@gmail.com)",
      "Content-Type": "application/x-www-form-urlencoded"
    }
  })
    .catch((r) => console.log(r));

  console.log(execute.data);
}

function generateStockTable() {
  //table header
  let data = '[table][tr][td][color=#E3E4E6]Nation[/color][/td][td][color=#E3E4E6]Company[/color][/td][td][color=#E3E4E6]Industry[/color][/td][td][color=#E3E4E6]Stocks for Sale[/color][/td][td][color=#E3E4E6]Stock Price (Flamas)[/color][/td][/tr]';

  for (const current of latestStockPrices.stockData){
    //get the census name and add a space in front of its capital letter
    let censusName = Object.keys(census)[current.censusid].replace(/([A-Z])/g, ' $1').trim();

    //generate table row
    let stock = `[tr][td][color=#E3E4E6]
      ${(current.AI === true) ? "NPC" : "[nation]" + current.nation + "[/nation]"}
      [/color]
      [/td][td]
      [color=#E3E4E6]
      [/color][color=#E3E4E6]
      ${current.stockName}[/color][/td][td][url=https://www.nationstates.net/cgi-bin/api.cgi?nation=${current.nation};q=census;scale=${current.censusid};mode=score]${censusName}[/url][/td][td][color=#E3E4E6]
      ${(current.TotalShares - current.AvaShares === current.TotalShares) ? current.TotalShares : `[strike]${current.TotalShares}[/strike]
${current.AvaShares}`}[/color]
      [/td][td][color=#E3E4E6]
      ${Math.round(current.stockPrice * 1000) / 1000}
      [/color][/td][/tr]`;

    //concat to end of data
    data += stock;
  }

  //return completed table
  return data + "[/table]\n";
}

async function generateDispatchHeader(news = ''){
  const date = latestStockPrices.date.replaceAll('-', '/');

  const censusData = await getRegionalCensusData('confederation_of_corrupt_dictators', census.EconomicOutput);
  const regionalGDP = Number(Math.round(censusData.SCORE));

  return `[background-block=#041119][center]
    [tab=1] [/tab]
    
    [color=#E3E4E6][hr][size=250][b]CONFEDERATION ECONOMY AND STOCK MARKET[/b][/size][/color]
    [tab=1] [/tab]
    
    [color=#E3E4E6][size=120][b]
    Calculator Offline
    [/b][/size][/color]
    [hr]
    [tab=1] [/tab]
    
    [table=plain][tr][td][tab=100][/tab][/td]
    [td][color=#FFFFFF][font=Courier][size=160]Avg. Inflation Rate[/size][/font][/color][/td]
    [td][color=#FFFFFF][font=Courier][size=160]Avg. Employment Rate[/size][/font][/color][/td]
    [td][color=#FFFFFF][font=Courier][size=160]Avg. Tax Rate[/size][/font][/color][/td]
    [td][color=#FFFFFF][font=Courier][size=160]Avg. Scientific Advancement Rate[/size][/font][/color][/td]
    [td][color=#FFFFFF][font=Courier][size=160]Avg. Economy Rating[/size][/font][/color][/td]
    [td][tab=100][/tab][/td][/tr]
    
    [tr][td][/td]
    [td][color=#FFFFFF][font=Courier][size=160]${Math.round(calculateInflation() * 10) / 10}%[/size][/font][/color][/td]
    [td][color=#FFFFFF][font=Courier][size=160]${Math.round(latestBackgroundData.AverageEmpRating * 100) / 100}[/size][/font][/color][/td]
    [td][color=#FFFFFF][font=Courier][size=160]${Math.round(latestBackgroundData.AverageTaxRating * 100) / 100}[/size][/font][/color][/td]
    [td][color=#FFFFFF][font=Courier][size=160]${Math.round(latestBackgroundData.AverageSciRating * 1000) / 1000}[/size][/font][/color][/td]
    [td][color=#FFFFFF][font=Courier][size=160]${Math.round(latestBackgroundData.AverageEcoRating * 1000) / 1000}[/size][/font][/color][/td]
    [td][/td][/tr]
    
    [/table]
    [tab=1] [/tab]
    
    [table=plain][tr][td][tab=300][/tab][/td]
    [td][color=#FFFFFF][font=Courier][size=160]Gross Regional Product[/size][/font][/color][/td]
    [td][color=#FFFFFF][font=Courier][size=160]Average GDP[/size][/font][/color][/td]
    
    [td][tab=300][/tab][/td][/tr]
    
    [tr][td][/td]
    [td][color=#FFFFFF][font=Courier][size=160]${formatNumber(regionalGDP) + " Flammas"}[/size][/font][/color][/td]
    [td][color=#FFFFFF][font=Courier][size=160]${formatNumber(latestBackgroundData.AverageGDPRating) + " Flammas"}[/size][/font][/color][/td]
    [td][/td][/tr]
    
    
    [tr][td][/td]
    [td]
    
    [/td]
    [td]
    
    [/td]
    [td][/td][/tr]
    
    [/table]
    
    [/center]
    
    [hr]
    
    [center][font=Courier][size=160][color=#E3E4E6]
    [b]RECENT FISCAL NEWS:[/b]
    
    
    [/color][/size][/font]
    
    [color=#E3E4E6][font=Courier]${(news !== '') ? news : "No news to report"}[/font][/color]
    
    [/center]
    [hr]
    
    [tab=1] [/tab]
    
    [center][font=Courier][size=160][color=#E3E4E6]
    
    [b]Price Update:[/b] ${date}
    [b]To purchase SOLD OUT stocks, contact the investor/s holding them[/b]
    [b][url=https://www.nationstates.net/page=dispatch/id=1660161]FAQ[/url][/b]
    
    [/color][/size][/font][/center]`;
}

function generateFooter(){
  return `[spoiler=Made By]
    [color=#FFFFFF]First Created by [nation]Nova Occidens[/nation]; Gif by [nation]Aeioux[/nation]; Maintenance and New Format by [nation]MineLegotipony[/nation]; Concept made by [nation]Hellslayer[/nation]; Automatically generated by [nation]The Yeetusa[/nation] [/color]
    [/spoiler]
    [tab=1] [/tab]
    
    [tab=1] [/tab]
    
    
    [/background-block]`;
}

function calculateInflation(){
  const currentBackground = latestBackgroundData;
  const oldBackground = backgroundData[backgroundData.length - 2][0];

  return (((oldBackground.AverageSciRating) * (oldBackground.AverageEmpRating) * (oldBackground.AverageEcoRating)) / (oldBackground.AverageTaxRating) /
    (((currentBackground.AverageSciRating) * (currentBackground.AverageEmpRating) * (currentBackground.AverageEcoRating)) / (currentBackground.AverageTaxRating)));
}

function formatNumber(num){
  let i = 0;
  while (num >= 1000){
    num /= 1000;
    i++;
  }

  num = Math.round(num * 1000) / 1000;
  switch (i){
  case 1:
    num += ' Thousand';
    break;
  case 2:
    num += ' Million';
    break;
  case 3:
    num += ' Billion';
    break;
  case 4:
    num += ' Trillion';
    break;
  case 5:
    num += ' Quadrillion';
    break;
  case 6:
    num += ' Quintillion';
    break;
  case 7:
    num += ' Sextillion';
    break;
  case 8:
    num += ' Septillion';
    break;
  default:
    throw new Error('Number is bigger than allowed');
  }

  return num;
}

module.exports = {
  pushDispatch
};

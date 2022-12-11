const axios = require('axios');
const stockprice = require('./const/stockprice.json');
const census = require('./const/census');
const backgroundData = require('./const/StockMarketBackGroundData.json');

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

function generateData(){
  const fullText = generateDispatchHeader() + generateStockTable();
}

function generateStockTable() {
  let data = '[table][tr][td][color=#E3E4E6]Nation[/color][/td][td][color=#E3E4E6]Company[/color][/td][td][color=#E3E4E6]Industry[/color][/td][td][color=#E3E4E6]Stocks for Sale[/color][/td][td][color=#E3E4E6]Stock Price (Flamas)[/color][/td][/tr]';
  for (const current of latestStockPrices.stockData){
    //get the census name and add a space in front of its capital letter
    let censusName = Object.keys(census)[current.censusid].replace(/([A-Z])/g, ' $1').trim();

    //generate table row
    let stock = `[tr][td][color=#E3E4E6]
      [nation]${current.nation}[/nation]
      [/color]
      [/td][td]
      [color=#E3E4E6]
      [/color][color=#E3E4E6]
      ${current.stockName}[/color][/td][td][url=https://www.nationstates.net/cgi-bin/api.cgi?nation=${current.nation};q=census;scale=${current.censusid};mode=score]${censusName}[/url][/td][td][color=#E3E4E6]
      ${(current.TotalShares - current.AvaShares === current.TotalShares) ? current.TotalShares : `<strike>${current.TotalShares}</strike>
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

function generateDispatchHeader(){
  const date = latestStockPrices.date.replaceAll('-', '/');
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
    [td][color=#B47174][font=Courier][size=160]Avg. Inflation Rate[/size][/font][/color][/td]
    [td][color=#B47174][font=Courier][size=160]Avg. Employment Rate[/size][/font][/color][/td]
    [td][color=#B47174][font=Courier][size=160]Avg. Tax Rate[/size][/font][/color][/td]
    [td][color=#7EE198][font=Courier][size=160]Avg. Scientific Advancement Rate[/size][/font][/color][/td]
    [td][color=#7EE198][font=Courier][size=160]Avg. Economy Rating[/size][/font][/color][/td]
    [td][tab=100][/tab][/td][/tr]
    
    [tr][td][/td]
    [td][color=#E3E4E6][font=Courier][size=160]${latestBackgroundData}[/size][/font][/color][/td]
    [td][color=#E3E4E6][font=Courier][size=160]57.71[/size][/font][/color][/td]
    [td][color=#E3E4E6][font=Courier][size=160]57.41[/size][/font][/color][/td]
    [td][color=#E3E4E6][font=Courier][size=160] 220.834[/size][/font][/color][/td]
    [td][color=#E3E4E6][font=Courier][size=160]76.925[/size][/font][/color][/td]
    [td][/td][/tr]
    
    [/table]
    [tab=1] [/tab]
    
    [table=plain][tr][td][tab=300][/tab][/td]
    [td][color=#7EE198][font=Courier][size=160]Gross Regional Product[/size][/font][/color][/td]
    [td][color=#7EE198][font=Courier][size=160]Average GDP[/size][/font][/color][/td]
    
    [td][tab=300][/tab][/td][/tr]
    
    [tr][td][/td]
    [td][color=#E3E4E6][font=Courier][size=160]325.622 Quintillion Flammas[/size][/font][/color][/td]
    [td][color=#E3E4E6][font=Courier][size=160]1078.220 Trillion Flammas[/size][/font][/color][/td]
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
    
    [color=#E3E4E6][font=Courier]Tl;dr GMC stocks fall hard! RCI increase hard![/font][/color]
    
    [/center]
    [hr]
    
    [tab=1] [/tab]
    
    [center][font=Courier][size=160][color=#E3E4E6]
    
    [b]Price Update:[/b] 05/12/2022
    [b]To purchase SOLD OUT stocks, contact the investor/s holding them[/b]
    [b][url=https://www.nationstates.net/page=dispatch/id=1660161]FAQ[/url][/b]
    
    [/color][/size][/font][/center]`;
}


const CensusScale = require('./const/census');
const { nationCensusId } = require('./const/nations');
const { axios } = require('./services/axios');
const fs = require('fs');
const { format } = require('date-fns');
let BGData = JSON.parse(fs.readFileSync('src/const/StockMarketBackGroundData.json', 'utf8'));
const { parseXml } = require("./services/helpers/parseXml");
const { getRegionCensus } = require("./services/fetchers/region");

JSON.parse(fs.readFileSync('src/const/stockprice.json', 'utf8'));

//This is specific to Stock Market - Collects Regional Economic Rating, Each Nation's Economic Rating and Each Stock's Industry's Stat

function NationData(nation, log, time, id, stat) {
  this.nationName = nation;
  this.savedlog = log;
  this.timeused = time;
  this.censusid = id;
  this.data = stat;
}

//To get a NationBackgroundData that is required to do math and everything else.
function NationBackgroundData(nation, time, ecoRating, ecoOutput, employment, taxation, scienceRate) {
  this.nationName = nation;
  this.timestamp = time;
  this.economy = ecoRating;
  this.GDP = ecoOutput;
  this.employment = employment;
  this.tax = taxation;
  this.science = scienceRate;
}

//To Place all the average Confederation Eco Stats.
function RegionAverageData(time, Eco, GDP, Emp, Tax, Sci) {
  this.serviceTime = time;
  this.averageEconomy = Eco;
  this.averageGDP = GDP;
  this.averageEmployment = Emp;
  this.averageTax = Tax;
  this.averageScience = Sci;
}

const fetchBackgroundData = async () => {
  //bypass expensive operations if today's data is already cached
  if (fs.existsSync(`${process.env.CACHE_DIR}/StockMarket-Background-${format(new Date(), "yyyy-M-dd")}.json`)){
    const cachedList = JSON.parse(fs.readFileSync(`${process.env.CACHE_DIR}/StockMarket-Background-${format(new Date(), "yyyy-M-dd")}.json`).toString());

    //this is the same as the calculations at the bottom part
    //sum everything up and then take the average
    let CCDEcoTotal = 0;
    let CCDGDPTotal = 0;
    let CCDempTotal = 0;
    let CCDTaxTotal = 0;
    let CCDSciTotal = 0;

    for (const nation of cachedList) {
      CCDEcoTotal += nation.economy;
      CCDGDPTotal += nation.GDP;
      CCDempTotal += nation.employment;
      CCDTaxTotal += nation.tax;
      CCDSciTotal += nation.science;
    }

    let averageEconomy = CCDEcoTotal / cachedList.length;
    let averageGDP = CCDGDPTotal / cachedList.length;
    let averageEmployment = CCDempTotal / cachedList.length;
    let averageTaxation = CCDTaxTotal / cachedList.length;
    let averageScience = CCDSciTotal / cachedList.length;

    return new RegionAverageData(
      format(new Date(), "yyyy-M-dd"),
      averageEconomy, averageGDP, averageEmployment, averageTaxation, averageScience
    );
  }

  //fetch list of nations
  let nationList = await axios.get('/', {
    params: {
      region: "confederation_of_corrupt_dictators",
      q: "nations"
    }
  });
  let nationToSearch = parseXml(nationList.data).REGION.NATIONS.split(":");
  console.log(`Serving for ${nationToSearch.length} nations`);

  //find all nations under 30 days
  let currentIndex = nationToSearch.length;
  let blacklist = [];

  let flagged = false;

  //find all nations with a residency under 30 days and blacklist them
  while (!flagged) {
    currentIndex -= 20;
    let nations = parseXml(await getRegionCensus("confederation_of_corrupt_dictators", CensusScale.Residency, currentIndex));
    //search through nations, we reverse this so the lowest residency is first
    for (const match of nations.REGION.CENSUSRANKS.NATIONS.NATION.reverse()) {
      try {
        const name = match.NAME;
        const score = match.SCORE;
        if (score < 30) {
          blacklist.push(name);
        } else {
          //break if this is the first one over 30 days
          flagged = true;
        }
      } catch (e) {}
    }
  }

  //remove those in the blacklist from nationToSearch
  let filteredNations = nationToSearch.filter((e) => !blacklist.includes(e));
  console.log(`${blacklist.length} nations were filtered for having a residency under 30 (${filteredNations.length}/${nationToSearch.length})`);

  //sum
  let CCDEcoTotal = 0;
  let CCDGDPTotal = 0;
  let CCDempTotal = 0;
  let CCDTaxTotal = 0;
  let CCDSciTotal = 0;

  let nationBackgroundData = [];

  for (let j = 0; j < filteredNations.length; j++ ) {
    console.log(`Serving request ${j}`);
    console.log(`Nation: ${filteredNations[j]}`);

    //Found Issue here. 
    let dataGathered = parseXml((await axios.get("/", {
      params: {
        nation: filteredNations[j],
        q: "census",
        scale: "all",
        mode: "score"
      }
    })).data);

    //add to running total
    CCDEcoTotal += dataGathered.NATION.CENSUS.SCALE[CensusScale.Economy].SCORE;
    CCDGDPTotal += dataGathered.NATION.CENSUS.SCALE[CensusScale.EconomicOutput].SCORE;
    CCDempTotal += dataGathered.NATION.CENSUS.SCALE[CensusScale.Employment].SCORE;
    CCDTaxTotal += dataGathered.NATION.CENSUS.SCALE[CensusScale.Taxation].SCORE;
    CCDSciTotal += dataGathered.NATION.CENSUS.SCALE[CensusScale.ScientificAdvancement].SCORE;

    //store data and push to list
    const newData = new NationBackgroundData(
      filteredNations[j],
      new Date(),
      dataGathered.NATION.CENSUS.SCALE[CensusScale.Economy].SCORE,
      dataGathered.NATION.CENSUS.SCALE[CensusScale.EconomicOutput].SCORE,
      dataGathered.NATION.CENSUS.SCALE[CensusScale.Employment].SCORE,
      dataGathered.NATION.CENSUS.SCALE[CensusScale.Taxation].SCORE,
      dataGathered.NATION.CENSUS.SCALE[CensusScale.ScientificAdvancement].SCORE
    );

    nationBackgroundData.push(newData);
  }

  //calculate averages
  let averageEconomy = CCDEcoTotal / nationBackgroundData.length;
  let averageGDP = CCDGDPTotal / nationBackgroundData.length;
  let averageEmployment = CCDempTotal / nationBackgroundData.length;
  let averageTaxation = CCDTaxTotal / nationBackgroundData.length;
  let averageScience = CCDSciTotal / nationBackgroundData.length;

  const CCDAverageData = new RegionAverageData(
    format(new Date(), "yyyy-M-dd"),
    averageEconomy, averageGDP, averageEmployment, averageTaxation, averageScience
  );

  //cache background data
  fs.writeFile(`${process.env.CACHE_DIR}/StockMarket-Background-${format(new Date(), "yyyy-M-dd")}.json`, JSON.stringify(nationBackgroundData), (err) => {
    // In case of a error throw err.
    if (err) throw err;});

  return CCDAverageData;
};

//Fetch background data, parse it, and save it to StockMarketBackGroundData.json
const generateBackgroundData = async () => {
  //initialize array for data
  let nationData = [];
  nationData.push(await fetchBackgroundData());

  //loop through nations with a company
  for (let i = 0; i < nationCensusId.length; i++) {
    //loop through a nation's censuses
    for (let j = 1; j < nationCensusId[i].length; j++) {
      try {
        console.log(`Querying: ${nationCensusId[i][0]}: ${Object.keys(CensusScale)[nationCensusId[i][j]]}(${nationCensusId[i][j]}): https://www.nationstates.net/cgi-bin/api.cgi?nation=${nationCensusId[i][0].replaceAll(" ", "_")};q=census;scale=${nationCensusId[i][j]};mode=score`);

        //fetch data
        let data = parseXml((await axios.get("/", {
          params: {
            nation: nationCensusId[i][0].replaceAll(" ", "_"),
            q: "census",
            scale: "all",
            mode: "score"
          }
        })).data);

        //create object and add to array
        const newNationData = new NationData(nationCensusId[i][0],
          `Querying: ${nationCensusId[i][0]}: ${Object.keys(CensusScale)[nationCensusId[i][j]]}(${nationCensusId[i][j]}): https://www.nationstates.net/cgi-bin/api.cgi?nation=${nationCensusId[i][0].replaceAll(" ", "_")};q=census;scale=${nationCensusId[i][j]};mode=score`,
          new Date(),
          Number(nationCensusId[i][j]),
          Number(data.NATION.CENSUS.SCALE[nationCensusId[i][j]].SCORE));
        nationData.push(newNationData);
      } catch (e) {
        console.log(e);
      }
    }
  }

  console.log(`Stock Done!`);

  //push to StockMarketBackGroundData.json
  BGData.push(nationData);
  fs.writeFile(`./const/StockMarketBackGroundData.json`, JSON.stringify(BGData), (err) => {
    // In case of a error throw err.
    if (err) throw err;});
};

module.exports = { generateBackgroundData };

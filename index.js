const delay = require('delay');
const fetch = require('node-fetch');
const fs = require('fs');
const prompt = require('prompt');

const allCurrency = require('./src/allCurrency');

const collect = async (currency, id) => {
    const timestamp = new Date().getTime();
    const startId = id;
    let result = [];
    let workingTime = 0;

    if (!fs.existsSync('./data')){
        fs.mkdirSync('./data');
    }

    while (timestamp > workingTime) {
        const raw = await fetch(
            `https://api.binance.com/api/v1/aggTrades?symbol=${currency}&fromId=${id}&limit=1000`,
        );
        if (raw.status == 419 || raw.status == 418) await delay(60000);
        workingTime = 0;
        const data = await raw.json();
        if (data.length) {
            id = data[data.length - 1].l;
            workingTime = data[data.length - 1].T;
            result = result.concat(data);
        } else {
            workingTime = new Date().getTime();
        }
        console.log(new Date(workingTime));
    }

    fs.writeFile(`./data/Binance-${currency}-from-${startId}-to-${id}.json`, `{"lastTradeId" : ${id}, "data" : ${JSON.stringify(result)} }`, err => {
        if(err)  console.log(err);
        else console.log("The file was saved!");
    });
};

const input = () => {
    prompt.start();
    console.log('Choose a currency (DEFAULT = BTCUSDT) and a start trade id (DEFAULT = 0)');

    prompt.get(['currency', 'id'], (err, result) => {
        if (err) {
            console.log(`An error just happen : ${err} \n\n Try again \n\n`);
            input();
        } else {
            result.currency = result.currency ? result.currency : 'BTCUSDT';
            if (allCurrency.includes(result.currency))
                collect(result.currency, result.id > 0 ? result.id : 0);
            else {
                console.log(`\nThe currency ${result.currency} is not supported`);
                input();
            }
        }
    });
};

input();

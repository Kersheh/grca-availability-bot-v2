const fs = require('fs');
const nconf = require('nconf');
const puppeteer = require('puppeteer');
const email = require('./email');

const config = nconf.file({ file: `${__dirname}/config/config.json` });
const DEBUG = false;
const DELAY = 1000;

const CAMP_LOCATIONS_REGEX = /(lakeview|lookout point|sandy bay|hillcrest|sunrise)/gi;
// const CAMP_LOCATIONS_REGEX = /(driftwood|hillcrest|lakeview|lookout point|lower parkside|meadowvale|sandy bay|sunrise|upper parkside)/gi;

async function executePuppeteerBot() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
    headless: !DEBUG,
    slowMo: DELAY
  });
  const page = await browser.newPage();
  await page.goto(config.get('GRCA:URL'));

  // page login form and submit
  await page.evaluate((email, password) => {
    document.getElementById('mainContent_txtEmail').value = email;
    document.getElementById('mainContent_txtPassword').value = password;
  }, config.get('GRCA:EMAIL'), config.get('GRCA:PASSWORD'));
  await page.click('#mainContent_bLogin');

  // campsite form search and submit
  await page.evaluate((parkId, duration, date) => {
    // browser dropdown selection
    function selectDropdown(document, id, value) {
      const element = document.getElementById(id);
      let opts;
      try {
        opts = element.options;
      } catch(err) {
        console.error('Dropdown element select failed, try increasing browser wait time');
      }
      const event = document.createEvent('HTMLEvents');
      let opt;

      for(opt, i = 0; opt = opts[i]; i++) {
        if(opt.value == value) {
          opt.selected = true;
          break;
        }
      }
      event.initEvent('change', false, true);
      element.dispatchEvent(event);
    }

    selectDropdown(document, 'mainContent_homeContent_ddlPlaces', parkId);
    selectDropdown(document, 'mainContent_homeContent_ddlNights', duration);
    document.getElementById('mainContent_homeContent_txtArrivalDate').value = date;
  }, config.get('GRCA:PARK_ID'), config.get('GRCA:DURATION'), config.get('GRCA:DATE'));
  await page.click('#mainContent_homeContent_btnSearch');

  const innerHTML = await page.evaluate(() => document.body.innerHTML);
  await browser.close();
  return innerHTML;
}

function emailAvailableSites(innerHTML) {
  let availableSites = [];

  innerHTML.replace(CAMP_LOCATIONS_REGEX, (match, site) => {
    availableSites.push(site);
  });

  availableSites = Array.from(new Set(availableSites));

  if(availableSites.length > 0) {
    console.log(`Newly available sites: ${availableSites}`);
    email.sendAll(availableSites);
  } else {
    console.log('No newly available sites found.');
  }
}

// fetch search result html page
(async () => {
  try {
    await email.sendTest();
    const innerHTML = await executePuppeteerBot();
    emailAvailableSites(innerHTML);
  } catch(err) {
    console.log(err);
  }
})();

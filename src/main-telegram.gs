const profiles = [
  {
    token: "ltoken_v2=gBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxCY; ltuid_v2=26XXXXX20;",
    genshin: true,
    honkai_star_rail: true,
    honkai_3: false,
    tears_of_themis: false,
    zenless_zone_zero: false,
    accountName: "YOUR NICKNAME"
  }
];

const telegram_notify = true
const myTelegramID = "1XXXXXXX0"
const telegramBotToken = ""

/** The above is the config. Please refer to the instructions on https://github.com/Ran-Mewo/hoyolab-auto-sign-safe/ for configuration. **/
/** The following is the script code. Please DO NOT modify. **/

const urlDict = {
  Genshin: 'https://sg-hk4e-api.hoyolab.com/event/sol/sign?lang=en-us&act_id=e202102251931481',
  Star_Rail: 'https://sg-public-api.hoyolab.com/event/luna/os/sign?lang=en-us&act_id=e202303301540311',
  Honkai_3: 'https://sg-public-api.hoyolab.com/event/mani/sign?lang=en-us&act_id=e202110291205111',
  Tears_of_Themis: 'https://sg-public-api.hoyolab.com/event/luna/os/sign?lang=en-us&act_id=e202308141137581',
  Zenless_Zone_Zero: 'https://sg-act-nap-api.hoyolab.com/event/luna/zzz/os/sign?lang=en-us&act_id=e202406031448091'
};

async function checkIn(){
  const messages = await Promise.all(profiles.map(autoSignFunction));
  const hoyolabResp = `${messages.join('\n\n')}`

  if (telegram_notify && telegramBotToken && myTelegramID) {
    postWebhook(hoyolabResp);
  }
}

function main() {
  // Get the current date
  const now = new Date();

  // Set the start time as 11 AM and the end time as 9 PM
  const startHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0).getHours();
  const endHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0, 0).getHours();

  // Calculate a random execution time between start and end times
  const executionTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    startHour + Math.floor(Math.random() * (endHour - startHour)), // Generates a Random Hour that's in between or equal to `startHour` and `endHour`
    Math.floor(Math.random() * 60), // Generates a Random Minute
    Math.floor(Math.random() * 60) // Generates a Random Second
  );

  // Delete the previous trigger, if any
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "checkIn") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Create the time-driven trigger
  ScriptApp.newTrigger("checkIn")
    .timeBased()
    .at(executionTime)
    .create();
}

function autoSignFunction({
  token,
  genshin = false,
  honkai_star_rail = false,
  honkai_3 = false,
  tears_of_themis = false,
  zenless_zone_zero = false,
  accountName
}) {
  const urls = [];

  if (genshin) urls.push(urlDict.Genshin);
  if (honkai_star_rail) urls.push(urlDict.Star_Rail);
  if (honkai_3) urls.push(urlDict.Honkai_3);
  if (tears_of_themis) urls.push(urlDict.Tears_of_Themis);
  if (zenless_zone_zero) urls.push(urlDict.Zenless_Zone_Zero);

  const header = {
    Cookie: token,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'x-rpc-app_version': '2.34.1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'x-rpc-client_type': '4',
    'Referer': 'https://act.hoyolab.com/',
    'Origin': 'https://act.hoyolab.com'
  };

  const options = {
    method: 'POST',
    headers: header,
    muteHttpExceptions: true,
  };

  let response = `Check-in completed for ${accountName}`;

  var sleepTime = 0
  const httpResponses = []
  for (const url of urls) {
    Utilities.sleep(sleepTime);
    httpResponses.push(UrlFetchApp.fetch(url, options));
    sleepTime = Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000; // Generates a random second between 1-10s in milliseconds
  }

  for (const [i, hoyolabResponse] of httpResponses.entries()) {
    const responseJson = JSON.parse(hoyolabResponse);
    const checkInResult = responseJson.message;
    const gameName = Object.keys(urlDict).find(key => urlDict[key] === urls[i])?.replace(/_/g, ' ');
    const bannedCheck = responseJson.data?.gt_result?.is_risk;

    if (bannedCheck) {
      response += `\n${gameName}: Auto check-in failed due to CAPTCHA blocking.`;
    } else {
      response += `\n${gameName}: ${checkInResult}`;
    }
  }

  return response;
}

function postWebhook(data) {
  let payload = JSON.stringify({
    'chat_id': myTelegramID,
    'text': data,
    'parse_mode': 'HTML'
  });

  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: payload,
    muteHttpExceptions: true
  };

  UrlFetchApp.fetch('https://api.telegram.org/bot' + telegramBotToken + '/sendMessage', options);
}

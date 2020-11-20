const sel = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const email = "i0116";
const password = "i0118";
const button = "idSIButton9";

const timeTable = JSON.parse(fs.readFileSync("./timeTable.json"));
const cred = JSON.parse(fs.readFileSync("./cred.json"));

/**
 *
 * DELAY FUNCTION
 *
 * @param {Number} delayTime
 */

const delay = async (delayTime) =>
  await new Promise((r) => setTimeout(r, delayTime));

/**
 *
 * Login Function
 * It will login your teams account
 * you must declare email and password in separate cred.json file
 *
 * @param {sel.WebDriver} driver
 */
async function login(driver) {
  try {
    // OPEN URL
    await driver.get("http://teams.microsoft.com");
    //WAIT TILL BODY ELEMENT GOT LOADED
    driver.wait(sel.until.elementsLocated(sel.By.css("body")), 10000);

    await delay(2000);
    //Enter Email
    await (await driver.findElement(sel.By.id(email))).sendKeys(cred.email);
    await delay(2000);
    //Click Next
    await (await driver.findElement(sel.By.id(button))).click();
    await delay(2000);
    //Enter Password
    await (await driver.findElement(sel.By.id(password))).sendKeys(
      cred.password
    );
    //Click Next
    await delay(2000);
    await (await driver.findElement(sel.By.id(button))).click();
    await delay(2000);
    //Click Yes on Stay signed In
    await (await driver.findElement(sel.By.id(button))).click();
    await delay(2000);
    //Click Use Website
    await (await driver.findElement(sel.By.className("use-app-lnk"))).click();
    // Inititate Join Classess
    await joinClasses(driver);
  } catch (error) {
    console.log(error);
  }
}

async function joinClasses(driver) {
  let currentSchedule;
  // let date = Date.now().toLocaleString();
  const date = new Date();

  //This will check whether thier is any lectures today>
  //change date.getDay()>=1 into date.getDay()>=0
  // if you want to include sundays
  // as otherwise it will skip if today is sunday

  const arrayIndex =
    date.getDay() <= timeTable.length + 1 && date.getDay() >= 1
      ? date.getDay() - 1
      : null;
  if (arrayIndex != null) {
    currentSchedule = timeTable[arrayIndex];
    for (let i = 0; i < currentSchedule.lecture.length; i++) {
      //JOIN A PARTICULAR CLASS
      await joinClass(currentSchedule.lecture[i], driver);
    }
    //ALl Classes Ended
    //Closing Process
    console.log("BOT ENDED");
    driver.quit();
    process.exit(0);
  } else {
    //No Classes found in today's schedule
    //Closing Process
    console.log("NO CLASSES TODAY SIR");
    driver.quit();
    process.exit(0);
  }
}
/**
 *
 * @param {timeTable.lecture} lecture
 * @param {sel.WebDriver} driver
 */
async function joinClass(lecture, driver) {
  try {
    await delay(5000);
    console.log(`Trying Joining ${lecture.name} class`);
    let date = new Date();
    console.log("Setting Dates");

    /* 
    Calculating the time difference between
    current time and lecture join time
    */
    let joiningDate = new Date();
    joiningDate.setHours(lecture.startTime.split(":")[0]);
    joiningDate.setMinutes(lecture.startTime.split(":")[1]);

    let leavingTime = new Date();
    leavingTime.setHours(lecture.endTime.split(":")[0]);
    leavingTime.setMinutes(lecture.endTime.split(":")[1]);

    //Checking Whether the lecture is still on or not
    //if not then terminte the function and try to join next lecture

    if (leavingTime.getTime() < date.getTime()) {
      console.log(`${lecture.name} Lecture Ended`);
      return false;
    }
    await delay(1200);
    await (
      await driver.findElement(
        sel.By.xpath(`//\*[@id="teams-app-bar"]/ul/li[3]`)
      )
    ).click();

    //SELECTING THE LECTURE FROM LIST
    console.log("Finding Lecture Button");
    const classes = await driver.findElements(
      sel.By.className("name-channel-type")
    );
    await delay(1000);

    for (const cls of classes) {
      const className = await (
        await cls.findElement(sel.By.className("truncate"))
      ).getAttribute("innerHTML");

      if (className.toLowerCase().trim() == lecture.name.toLowerCase().trim()) {
        console.log("Lecture Button Find");
        await cls.click();
        break;
      }
    }

    console.log(`curretnTime: ${new Date().toString()}`);
    console.log(`joingTime:${joiningDate.toString()}`);
    console.log(
      `Waiting Time:-- ${
        (joiningDate.getTime() - date.getTime()) / 1000
      } seconds`
    );

    //Wait till current time match the lecture start time
    //if the current time exceed the lecture start time it will wait fro only 1 second
    await new Promise((r) =>
      setTimeout(
        r,
        joiningDate.getTime() - date.getTime() < 0
          ? 1000
          : joiningDate.getTime() - date.getTime()
      )
    );

    console.log(`Waiting 2000ms`);
    await delay(2000);

    console.log("Trying To Find Join Button");

    //Trying to find Join Button
    //IT will refresh the page every 1 mint
    // if button dont get find after 15 mint it will terminate function
    let k = 1;
    while (k < 15) {
      try {
        //TRy to Click Join Button
        await (
          await driver.findElement(sel.By.className("ts-calling-join-button"))
        ).click();
        console.log("Button Find And Clicked");
        break;
      } catch (err) {
        console.log(err);
        console.log("Button Still not found");
        console.log("Waiting for a mint");
        //Wait for 58 Seconds
        await await new Promise((r) => setTimeout(r, 58000));
        console.log("Refreshing Page");
        driver.navigate().refresh();
        //Wait for 10 seconds
        await new Promise((r) => setTimeout(r, 10000));
      }
      k++;
    }
    //If button not found then terminate the function
    if (k == 15) return false;

    await delay(2000);

    //Turning Off Webcam
    console.log("turning off webcam");
    const micVideoSwitch = await driver.findElements(
      sel.By.className("ts-toggle-button")
    );
    if (
      (await (
        await micVideoSwitch[0].findElement(sel.By.className("style-layer"))
      ).getAttribute("title")) === "Turn camera off"
    )
      await micVideoSwitch[0].click();
    console.log("turning off Mic");
    //Turning Off MicroPhone
    if (
      (await (
        await micVideoSwitch[1].findElement(sel.By.className("style-layer"))
      ).getAttribute("title")) === "Mute microphone"
    )
      await micVideoSwitch[1].click();

    //Clicking Join Button
    console.log("Clicking Join Button");
    const joinButton = await driver.findElement(
      sel.By.xpath(
        `//\*[@id="page-content-wrapper"]/div[1]/div/calling-pre-join-screen/div/div/div[2]/div[1]/div[2]/div/div/section/div[1]/div/div/button`
      )
    );
    await joinButton.click();
    date = new Date();
    leavingTime = new Date();
    leavingTime.setHours(lecture.endTime.split(":")[0]);
    leavingTime.setMinutes(lecture.endTime.split(":")[1]);
    console.log("Waiting for lecture to end");
    console.log(
      `Waiting for ${(leavingTime.getTime() - date.getTime()) / 1000} seconds`
    );
    await new Promise((r) =>
      setTimeout(
        r,
        leavingTime.getTime() - date.getTime() < 0
          ? 1000
          : leavingTime.getTime() - date.getTime()
      )
    );
    try {
      console.log("Trying to end meeting");

      await (
        await driver.findElement(sel.By.className("ts-calling-screen"))
      ).click();
      await new Promise((r) => setTimeout(r, 1000));

      await new Promise((r) => setTimeout(r, 1000));
      await (
        await driver.findElement(sel.By.xpath(`//\*[@id="hangup-button"]`))
      ).click();
      console.log("Lecture Left");
    } catch (err) {
      console.log(err);
      console.log("Class Already Ended By Teacher");
    }
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

/*** STARTING POINT OF BOT */
(async function executeBot() {
  try {
    //CHROME OPTIONS
    const opt = new chrome.Options();
    opt.addArguments("--disable-infobars");
    opt.addArguments("start-maximized");
    opt.addArguments("--disable-extensions");
    opt.addArguments("--start-maximized");
    //CHANGE VALUE FROM 1 To 2 to disable
    opt.setUserPreferences({
      "profile.default_content_setting_values.media_stream_mic": 1,
      "profile.default_content_setting_values.media_stream_camera": 1,
      "profile.default_content_setting_values.geolocation": 1,
      "profile.default_content_setting_values.notifications": 1,
    });
    //INITIATE DRIVER
    let driver = await new sel.Builder()
      .forBrowser("chrome")
      .setChromeOptions(opt)
      .build();
    // login into teams
    await login(driver);
  } catch (err) {
    console.log(err);
    console.log("Something Went Wrong ");
    console.log("Exiting Process");
    process.exit(1);
  }
})();

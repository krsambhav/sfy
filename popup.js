var traceValue = generateRandomStringBytes(16);
var parentValue = generateRandomStringBytes(8);

function generateRandomStringBytes(size) {
    let id = "";
    for (let i = 0; i < size; i++) {
        id += ("00" + Math.floor(Math.random() * 256).toString(16)).slice(-2);
    }
    return id;
}

function generateTranceparent() {
    return `00-${traceValue}-${parentValue}-01`;
}

function generateRequestID() {
    return `|${traceValue}.${parentValue}`;
}

async function fetchPrimaryID() {
    var homePageResponse = await fetch(
        "https://www.usvisascheduling.com/en-US/",
        {
            headers: {
                accept: "application/json, text/javascript, */*; q=0.01",
                "accept-language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "request-id": generateRequestID(),
                "sec-ch-ua":
                    '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
                "sec-ch-ua-arch": '"arm"',
                "sec-ch-ua-bitness": '"64"',
                "sec-ch-ua-full-version": '"122.0.6261.69"',
                "sec-ch-ua-full-version-list":
                    '"Chromium";v="122.0.6261.69", "Not(A:Brand";v="24.0.0.0", "Google Chrome";v="122.0.6261.69"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-model": '""',
                "sec-ch-ua-platform": '"macOS"',
                "sec-ch-ua-platform-version": '"14.3.1"',
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                traceparent: generateTranceparent(),
                "x-requested-with": "XMLHttpRequest",
            },
            referrer:
                "https://www.usvisascheduling.com/en-US/ofc-schedule/?reschedule=true",
            referrerPolicy: "strict-origin-when-cross-origin",
            method: "GET",
            mode: "cors",
            credentials: "include",
        }
    );
    var homePageData = await homePageResponse.text();
    const primaryNameRegex =
        /(?<=<span class="username">\s*)[^<]+?(?=\s*\(\d+\)\s*<\/span>)/;
    const applicationIDRegex = /"applicationId": "([a-f0-9-]{36})"/;

    // Use the match() method to find matches
    const primaryNameMatches = homePageData.match(primaryNameRegex);
    console.log(primaryNameMatches);
    const applicationIDMatches = homePageData.match(applicationIDRegex);

    // Check if a match is found and extract the applicationId value
    if (applicationIDMatches) {
        var primaryNameAndIDDict = {
            primaryName: primaryNameMatches[0].trim(),
            primaryID: applicationIDMatches[1],
        };
        return primaryNameAndIDDict;
    } else {
        console.log("No applicationId found");
    }
}

async function checkReschedule() {
    var data = await fetch(
        "https://www.usvisascheduling.com/en-US/appointment-confirmation/"
    );
    var text = await data.text();
    try {
        var ofcCount = text.match(/OFC APPOINTMENT DETAILS/g).length;
        if (ofcCount == 0) return false;
        else return true;
    } catch (error) {
        return false;
    }
}

async function fetchDependentIDs(primaryID, isReschedule) {
    const now = Date.now();
    var url = `https://www.usvisascheduling.com/en-US/custom-actions/?route=/api/v1/schedule-group/query-family-members-ofc&cacheString=${now}`;
    if (isReschedule == "true") {
        url = `https://www.usvisascheduling.com/en-US/custom-actions/?route=/api/v1/schedule-group/query-family-members-ofc-reschedule&cacheString=${now}`;
    }
    var dependentDataResponse = await fetch(url, {
        headers: {
            accept: "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-US,en;q=0.8",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "request-id": generateRequestID(),
            "sec-ch-ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Brave";v="122"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-model": '""',
            "sec-ch-ua-platform": '"Linux"',
            "sec-ch-ua-platform-version": '"5.15.0"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "sec-gpc": "1",
            traceparent: generateTranceparent(),
            "x-requested-with": "XMLHttpRequest",
        },
        referrer: "https://www.usvisascheduling.com/en-US/ofc-schedule/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: `parameters={"primaryId":"${primaryID}","visaClass":"all"}`,
        method: "POST",
        mode: "cors",
        credentials: "include",
    });
    var familyData = await dependentDataResponse.json();
    var membersArr = familyData["Members"];
    var dependentIDsArr = [];
    if (membersArr.length == 0) return primaryID;
    membersArr.forEach((member) => {
        dependentIDsArr.push(member["ApplicationID"]);
    });
    return JSON.stringify(dependentIDsArr);
}


async function returnRandom() {
    var primaryInput = document.getElementById("primary-id-input");
    primaryInput.value = "1";
}

function fillInput() {
    document.getElementById("primary-id-input").value = "OFC";
}

document.addEventListener("DOMContentLoaded", async function () {
    var fetchTimeout;
    var primaryName = "";
    var primaryID = "";
    var dependentsIDs = "";
    var lastMonth = "";
    var lastDate = "";
    var earliestMonth = "";
    var earliestDate = "";
    var city = "mumbai";
    var consularCity = "mumbai";
    var interval = "1";
    var minute = "0";
    var consularRange;
    var awaitChecker = "";
    var delay = 10;
    var isConsularOnly;
    var isOFCOnly;
    var rescheduleInputValue;
    var userQty = 0;
    var isSleeper = true;
    var studentMode = false;
    var visaClass;
    var [currentMonth, currentDate] = new Date()
        .toLocaleString("en-US", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "2-digit",
        })
        .split("/");
    document.getElementById("earliest-date-input").value =
        parseInt(currentDate) + 1;
    document.getElementById("earliest-month-input").value =
        parseInt(currentMonth);
    console.log(0);
    var fillButton = document.getElementById("fill-btn");
    var resetButton = document.getElementById("reset-btn");
    var primaryIDButton = document.getElementById("set-primary-id-btn");
    var dependentIDButton = document.getElementById("set-dependents-id-btn");
    var startAllButton = document.getElementById("start-btn");
    var fillFromDBButton = document.getElementById("fill-db-btn");
    var OFCOnlyButton = document.getElementById("start-ofc-btn");
    var consularOnlyButton = document.getElementById("start-consular-btn");
    var citySelector = document.getElementById("city-selector");
    var minuteSelector = document.getElementById("minute-selector");
    var intervalSelector = document.getElementById("interval-selector");
    var consularCitySelector = document.getElementById("consular-city-selector");
    var consularRangeInput = document.getElementById("cons-diff-input");
    var studentCheckbox = document.getElementById("student-checkbox");

    studentCheckbox.addEventListener('change', function () {
        // Update studentMode based on whether the checkbox is checked
        studentMode = this.checked;
        console.log(studentMode);
        console.log('studentMode is now:', studentMode); // Optional: log the current state to the console
    });
    try {
        cookieData = await chrome.cookies.getAll({
            url: "https://www.kumarsambhav.me/",
        });
        cookieDict = {};
        for (let index = 0; index < cookieData.length; index++) {
            cookieDict[cookieData[index]["name"]] = cookieData[index]["value"];
        }
        // console.log(cookieDict)
        if (cookieDict["primaryID"] != undefined) {
            primaryID = cookieDict["primaryID"];
            primaryName = cookieDict["primaryName"];
            dependentsIDs = cookieDict["dependentsIDs"];
            userQty = parseInt(cookieDict["userQty"]);
            rescheduleInputValue = parseInt(cookieDict["rescheduleInputValue"]);
            earliestDate = parseInt(cookieDict["earliestDate"]);
            console.log(1);
            earliestMonth = parseInt(cookieDict["earliestMonth"]);
            lastDate = parseInt(cookieDict["lastDate"]);
            lastMonth = parseInt(cookieDict["lastMonth"]);
            fetchTimeout = parseInt(cookieDict["fetchTimeout"]);
            studentMode = cookieDict["studentMode"] == undefined ? false : cookieDict["studentMode"] == 'true' ? true : false;
            if (studentMode) {
                studentCheckbox.checked = true;
            }
            delay = parseInt(cookieDict["delay"]);
            city = cookieDict["city"] == undefined ? "mumbai" : cookieDict["city"];
            interval =
                cookieDict["interval"] == undefined ? "1" : cookieDict["interval"];
            minute = cookieDict["minute"] == undefined ? "0" : cookieDict["minute"];
            citySelector.value = city;
            consularCity =
                cookieDict["consularCity"] == undefined
                    ? "mumbai"
                    : cookieDict["consularCity"];
            consularCitySelector.value = consularCity;
            document.getElementById("primary-id-input").value = primaryID;
            document.getElementById("primary-user-name-span").innerHTML =
                primaryName + " (Cookie)";
            document.getElementById("res-input").value = rescheduleInputValue;
            document.getElementById("primary-user-qty-span").innerHTML = userQty;
            document.getElementById("dependents-id-input").value = dependentsIDs;
            intervalSelector.value = interval;
            minuteSelector.value = minute;
            document.getElementById("earliest-month-input").value = earliestMonth;
            document.getElementById("earliest-date-input").value = earliestDate;
            document.getElementById("last-month-input").value = lastMonth;
            document.getElementById("last-date-input").value = lastDate;
            document.getElementById("timeout-input").value = fetchTimeout;

            document.getElementById("delay-input").value =
                delay == undefined ? 10 : delay;
        }
    } catch (error) {
    }
    // Find the button by its ID

    // var checkRescheduleButton = document.getElementById("check-res-btn");

    async function handlePrimaryButtonClick() {
        primaryIDAndNameDict = await fetchPrimaryID();
        primaryName = primaryIDAndNameDict["primaryName"];
        primaryID = primaryIDAndNameDict["primaryID"];
        // Code to execute when the button is clicked
        // console.log(primaryName)
        document.getElementById("primary-id-input").value = primaryID;
        await chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "primaryID",
            value: primaryID,
        });
        await chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "primaryName",
            value: primaryName,
        });
    }

    async function handleCheckRescheduleButtonClick() {
        var applicationIsReschedule = await checkReschedule();
        if (applicationIsReschedule) rescheduleInputValue = 1;
        else rescheduleInputValue = 0;
        document.getElementById("res-input").value = rescheduleInputValue;
        await chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "rescheduleInputValue",
            value: rescheduleInputValue.toString(),
        });
    }

    async function handleDependentButtonClick() {
        isReschedule = parseInt(document.getElementById("res-input").value);
        if (isReschedule == 0) isReschedule = "false";
        else isReschedule = "true";
        dependentsIDs = await fetchDependentIDs(primaryID, isReschedule);
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "dependentsIDs",
            value: dependentsIDs,
        });
        document.getElementById("dependents-id-input").value = dependentsIDs;
        var dIdsFirstLetter = dependentsIDs.slice(0, 1);

        if (dIdsFirstLetter == "[") {
            userQty = JSON.parse(dependentsIDs).length;
        } else {
            userQty = 1;
        }
        document.getElementById("primary-user-qty-span").innerHTML = userQty;
        document.getElementById("primary-user-name-span").innerHTML = primaryName;
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "userQty",
            value: userQty.toString(),
        });
    }

    // Attach an onclick event listener to the button
    fillFromDBButton.onclick = async function () {
        try {
            const response = await fetch("http://104.192.2.29:3000/users");
            const data = await response.json();
            var userWithPax;
            // Then you filter out the data to find users with pax value of 1
            if (studentMode) {
                userWithPax = data.filter((user) => user.visaClass === "F-1");
            } else
                userWithPax = data.filter((user) => user.pax === 1);
            // console.log(userWithPax)
            const userArr = userWithPax[0];
            primaryID = userArr["id"];
            dependentsIDs = userArr["applicantsID"];
            primaryName = userArr["name"];
            userQty = userArr["pax"];
            visaClass = userArr["visaClass"];
            studentMode = userArr["visaClass"] === "F-1";
            document.getElementById("primary-id-input").value = primaryID;
            document.getElementById("dependents-id-input").value = dependentsIDs;
            document.getElementById("primary-user-name-span").innerHTML = primaryName;
            document.getElementById("primary-user-qty-span").innerHTML = userQty;
            await chrome.cookies.set({
                url: "https://www.kumarsambhav.me/",
                name: "studentMode",
                value: studentMode.toString(),
            });
            await chrome.cookies.set({
                url: "https://www.kumarsambhav.me/",
                name: "primaryID",
                value: primaryID,
            });
            await chrome.cookies.set({
                url: "https://www.kumarsambhav.me/",
                name: "primaryName",
                value: primaryName,
            });
            chrome.cookies.set({
                url: "https://www.kumarsambhav.me/",
                name: "dependentsIDs",
                value: dependentsIDs,
            });
            chrome.cookies.set({
                url: "https://www.kumarsambhav.me/",
                name: "userQty",
                value: userQty.toString(),
            });
        } catch (error) {
            console.error(error);
        }
    };
    fillButton.onclick = async function () {
        await handlePrimaryButtonClick();
        await handleCheckRescheduleButtonClick();
        await handleDependentButtonClick();
        lastMonth = parseInt(document.getElementById("last-month-input").value);
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "lastMonth",
            value: lastMonth.toString(),
        });
        lastDate = parseInt(document.getElementById("last-date-input").value);
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "lastDate",
            value: lastDate.toString(),
        });
        fetchTimeout = parseInt(document.getElementById("timeout-input").value);
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "fetchTimeout",
            value: fetchTimeout.toString(),
        });
        earliestMonth = parseInt(
            document.getElementById("earliest-month-input").value
        );
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "earliestMonth",
            value: earliestMonth.toString(),
        });
        earliestDate = parseInt(
            document.getElementById("earliest-date-input").value
        );
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "earliestDate",
            value: earliestDate.toString(),
        });
        delay = parseInt(document.getElementById("delay-input").value);
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "delay",
            value: delay.toString(),
        });
        consularRange = parseInt(consularRangeInput.value);
        // await handleCheckRescheduleButtonClick();
        // await handleDependentButtonClick();
    };
    resetButton.onclick = async function () {
        var tempCurrentMonth = new Date().getMonth() + 1;
        var tempCurrentDate = new Date().getDate();
        var tempLastMonth =
            tempCurrentDate <= 15 ? tempCurrentMonth : tempCurrentMonth + 1;
        earliestMonth = new Date().getMonth() + 1;
        earliestDate = tempCurrentDate;
        lastMonth = tempLastMonth;
        lastDate =
            tempLastMonth == tempCurrentMonth
                ? tempCurrentDate + 15
                : (tempCurrentDate + 15) % 30;
        delay = 10;
        isSleeper = true;
        document.getElementById("earliest-month-input").value = tempCurrentMonth;
        document.getElementById("earliest-date-input").value = earliestDate;
        document.getElementById("last-month-input").value = lastMonth;
        document.getElementById("last-date-input").value = lastDate;
        document.getElementById("delay-input").value = 1;
        document.getElementById("sleeper-input").checked = true;
        citySelector.value = "mumbai";
        city = "mumbai";
        consularCitySelector.value = "mumbai";
        consularCity = "mumbai";
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "city",
            value: city,
        });
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "consularCity",
            value: consularCity,
        });
    };
    citySelector.onchange = async function () {
        city = citySelector.value;
        consularCity = city;
        consularCitySelector.value = city;
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "city",
            value: city,
        });
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "consularCity",
            value: consularCity,
        });
    };
    intervalSelector.onchange = async function () {
        interval = intervalSelector.value;
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "interval",
            value: interval,
        });
    };
    minuteSelector.onchange = async function () {
        minute = minuteSelector.value;
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "minute",
            value: minute,
        });
    };
    consularCitySelector.onchange = async function () {
        consularCity = consularCitySelector.value;
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "consularCity",
            value: consularCity,
        });
    };
    consularRangeInput.onchange = async function () {
        consularRange = parseInt(consularRangeInput.value);
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "consularRange",
            value: consularRange,
        });
    };
    startAllButton.onclick = async function () {
        if (consularRange == undefined) consularRange = 20;
        console.log("OK");
        lastMonth = parseInt(document.getElementById("last-month-input").value);

        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "lastMonth",
            value: lastMonth.toString(),
        });
        lastDate = parseInt(document.getElementById("last-date-input").value);
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "lastDate",
            value: lastDate.toString(),
        });
        fetchTimeout = parseInt(document.getElementById("timeout-input").value);
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "fetchTimeout",
            value: fetchTimeout.toString(),
        });
        earliestMonth = parseInt(
            document.getElementById("earliest-month-input").value
        );
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "earliestMonth",
            value: earliestMonth.toString(),
        });
        earliestDate = parseInt(
            document.getElementById("earliest-date-input").value
        );
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "earliestDate",
            value: earliestDate.toString(),
        });
        isReschedule = parseInt(document.getElementById("res-input").value);
        if (isReschedule == 0) isReschedule = "false";
        else isReschedule = "true";
        isSleeper = parseInt(document.getElementById("sleeper-input").checked);
        awaitChecker = parseInt(document.getElementById("await-input").value);
        if (awaitChecker == 0) awaitChecker = false;
        else awaitChecker = true;
        delay = parseInt(document.getElementById("delay-input").value);
        chrome.cookies.set({
            url: "https://www.kumarsambhav.me/",
            name: "delay",
            value: delay.toString(),
        });
        isConsularOnly = false;
        isOFCOnly = false;
        var userDetails = {
            primaryName,
            primaryID,
            dependentsIDs,
            lastMonth,
            lastDate,
            earliestMonth,
            earliestDate,
            city,
            consularCity,
            consularRange,
            isReschedule,
            isSleeper,
            awaitChecker,
            delay,
            fetchTimeout,
            isOFCOnly,
            isConsularOnly,
            interval,
            minute,
            studentMode
        };
        chrome.runtime.sendMessage(userDetails, function (response) {
            console.log(response);
        });
    };
});

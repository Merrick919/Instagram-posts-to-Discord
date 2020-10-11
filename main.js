// Copyright (c) 2020 Fernando
// Url: https://github.com/dlfernando/
// License: MIT

// Modified and translated from Python to JavaScript by Merrick919

// Variables you have to change are:
// 1. targetInstagramUsername
// 2. webhookID
// 3. webhookURL
//
// For targetInstagramUsername, it's simply the username of the account you want to monitor.
// For webhookID and webhookURL, first create a webhook in Discord, then copy the webhook URL.
// The first part after "https://discordapp.com/api/webhooks/" is the webhook ID (some numbers).
// The second part after the webhook ID is the webhook token.
// You can just replace the targetInstagramURL and webhookURL links directly if you want.

// Requires the node-fetch module.
const fetch = require("node-fetch")

// Requires the fs module.
const fs = require("fs");

// Requires the chalk module.
const chalk = require("chalk");

const targetInstagramUsername = "TARGET_INSTAGRAM_USERNAME_HERE";
const targetInstagramURL = ("https://www.instagram.com/" + targetInstagramUsername + "/?__a=1");

const webhookID = "WEBHOOK_ID_HERE";
const webhookToken = "WEBHOOK_TOKEN_HERE";
const webhookURL = ("https://discordapp.com/api/webhooks/" + webhookID + "/" + webhookToken);

const database = "database.txt";

// Function to write data to the database file.
function writeToFile(content, filename) {

    let filepath = (".\\" + filename);

    fs.access(filepath, fs.constants.R_OK, (err) => {

        if (err) {

            let timeNow = new Date();
            let timeNowISO = timeNow.toISOString();

            console.error(err);
            console.log(chalk.blue(timeNowISO) + chalk.red("An error occured trying to read the file \"" + filename + "\"."));
            
        } else {
            
            fs.writeFile(filepath, content, err => {

                if (err) {

                    let timeNow = new Date();
                    let timeNowISO = timeNow.toISOString();

                    console.error(err);
                    console.log(chalk.blue(timeNowISO) + chalk.red("An error occured trying to write to the file \"" + filename + "\"."));

                }

            });
            
        }

    });

}

// Function to read data from the database file.
function readFromFile(filename) {

    let filepath = (".\\" + filename);

    fs.access(filepath, fs.constants.R_OK, (err) => {

        if (err) {

            let timeNow = new Date();
            let timeNowISO = timeNow.toISOString();

            console.error(err);
            console.log(chalk.blue(timeNowISO) + chalk.red("An error occured trying to read the file \"" + filename + "\"."));
            
        } else {
            
            fs.readFile(filepath, "utf8", (err, data) => {

                if (err) {

                    let timeNow = new Date();
                    let timeNowISO = timeNow.toISOString();

                    console.error(err)
                    console.log(chalk.blue(timeNowISO) + chalk.red("An error occured trying to read the file \"" + filename + "\"."));

                } else {

                    return data;

                }

            });
            
        }

    });
    
}

// Function to get the target user's full name.
function getUserFullName(jsonData) {

    return jsonData["graphql"]["user"]["full_name"];

}

// Function to get the target user's total image/post count.
function getTotalImages(jsonData) {

    return Math.round(jsonData["graphql"]["user"]["edge_owner_to_timeline_media"]["count"]);

}

// Function to get the target user's last publication URL.
function getLastPublicationURL(jsonData) {

    return jsonData["graphql"]["user"]["edge_owner_to_timeline_media"]["edges"][0]["node.shortcode"];

}

// Function to get the target user's last image/post URL.
function getLastImageURL(jsonData) {

    return jsonData["graphql"]["user"]["edge_owner_to_timeline_media"]["edges"][0]["node"]["display_url"];

}

// Function to get the target user's last thumbnail URL.
function getLastThumbURL(jsonData) {

    return jsonData["graphql"]["user"]["edge_owner_to_timeline_media"]["edges"][0]["node"]["thumbnail_src"];

}

// Function to get the target user's image/post description.
function getImageDescription(jsonData) {

    return jsonData["graphql"]["user"]["edge_owner_to_timeline_media"]["edges"][0]["node"]["edge_media_to_caption"]["edges"][0]["node"]["text"];

}

// Function to interact with the Discord webhook.
function webhook(jsonData) {

    try {

        // For all parameters, see https://discordapp.com/developers/docs/resources/webhook#execute-webhook.
        // For all parameters, see https://discordapp.com/developers/docs/resources/channel#embed-object.

        data = {};
        data["embeds"] = [];
        embed = {};
        embed["color"] = 15467852;
        embed["title"] = ("New pic of @" + targetInstagramUsername);
        embed["url"] = ("https://www.instagram.com/p/" + getLastPublicationURL(jsonData) + "/");
        embed["description"] = getImageDescription(jsonData);
        // embed["image"] = {"url":get_last_thumb_url(jsonData)}; // Uncomment this to send a bigger image to Discord.
        embed["thumbnail"] = {"url":getLastThumbURL(jsonData)};
        data["embeds"].append(embed);

        // Use the node-fetch module to interact with the Discord webhook.
        fetch(webhookURL, {

            method: "post",
            body:    JSON.stringify(data),
            headers: { "Content-Type": "application/json" }

        });

    } catch (err) {

        let timeNow = new Date();
        let timeNowISO = timeNow.toISOString();

        console.error(err);
        console.log(chalk.blue(timeNowISO) + chalk.red("An error occured."));

    }

}

// The main function to test for new images/posts and interact with the Discord webhook if there is/are (a) new image(s)/post(s).
async function main() {
     
    try {

        // The function to test for new images/posts.
        function test(jsonData) {
            
            let timeNow = new Date();
            let timeNowISO = timeNow.toISOString();

            // This compares the recorded old publication URL in the database file
            // with the newest retrieved publication URL.

            // If the recorded old publication URL is the same as the newest retrieved publication URL,
            // it most likely means that there are no new images/posts.
            if (readFromFile(database) == getLastPublicationURL(jsonData)) {

                console.log(chalk.blue(timeNowISO) + " " + chalk.yellow("No new image(s) found."));
            
            // If the recorded old publication URL is not the same as the newest retrieved publication URL,
            // it most likely means that there is/are (a) new image(s)/post(s).
            } else {
                
                // Record the new publication URL to the database file.
                writeToFile(getLastPublicationURL(jsonData), database);
                console.log(chalk.blue(timeNowISO) + " " + chalk.green("New image(s) found."));
                webhook(jsonData);
                        
            }

        }

        // Use the node-fetch module to retrieve the data.
        const jsonData = await fetch(targetInstagramURL).then(res => res.json());

        // Wait 20 seconds so there is a bigger total delay between checks for new images/posts (total: 20 seconds) and so the data can be retrieved. 
        setTimeout(function() { test(jsonData); }, 20000);

    } catch (err) {

        let timeNow = new Date();
        let timeNowISO = timeNow.toISOString();

        console.error(err);
        console.log(chalk.blue(timeNowISO) + chalk.red("An error occured."));

    }

}

// Start the main function every 20 seconds.
setInterval(function() { main(); }, 20000);
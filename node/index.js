/*
    Starfiles Network
    Created by DwifteJB and QuixThe2nd
*/

import express from 'express';
import * as fs from 'fs';
import fetch from 'node-fetch';
import * as nodeUpdate from './src/modules/nodeupdater.js'
const app = express()
app.get('/whoami', async(req,res) => {
    const showndata = {}
    const whoamidata = JSON.parse(fs.readFileSync("./src/config.json"));
    // set the data you want to be shown here:
    showndata["settings"] = whoamidata.settings;
    res.json(showndata);
})
app.post('/nodes:add', async (req,res) => {
    /*
        We just got a list of nodes and we
        need to add it to our nodes.json file
    */
    if(req.query == undefined || req.query.nodes == undefined) {
        return res.json({"status":false,"error":"Nodes not specified."});
    }
    const {nodes} = req.query;
    try {
        JSON.parse(nodes)
    } catch(e) {
        return res.json({"status":false,"error":"Invalid JSON array for nodes."})
    }
    const parseNodes = JSON.parse(nodes)
    const ourNodes = JSON.parse(fs.readFileSync("./src/nodes.json"));
    let pushed = []
    console.log("Adding new nodes to our collection!")
    for(var index in ourNodes) {
        for(var index2 in parseNodes) {
            /*
                We want to get the settings from the node itself
                this is to prevent a swapping attack.
            */
            if (index != index2) {
                try {
                    const response = await fetch(`${index2}/whoami`, {
                        method: 'post'
                    }).json()
                    ourNodes[index2] = response.settings;
                } catch (e) {
                    // This is bad, it seems the server is offline. We have to default back to the nodes settings.
                    console.log(`[WARNING]: The node ${index2} seems to be invalid or offline.`)
                    ourNodes[index2] = parseNodes[index2];
                }
                pushed.push(index2)
            }
        }
        if (pushed.length == 0) {
            console.log("No new nodes were added.")
            return res.json({"status":true,"warning":"All nodes specified were already added."})
        }
        fs.writeFileSync("./src/nodes.json",JSON.stringify(ourNodes,null,2))
        console.log(`Just added: ${pushed.join(", ")} nodes to our collection!`)
        return res.json({"status":true})
    }

})
app.get('/nodes', async (req,res) => {
    /*
        We are getting a request from another node that is
        asking us our list of known nodes.
    */
   res.json(JSON.parse(fs.readFileSync("./src/nodes.json")));
})
app.post('/announce', async (req,res) => {
    if(req.query == undefined || req.query.URL == undefined) {
        return res.json({"status":false,"error":"No URL was specified."});
    }
    const {URL} = req.query
    let settings;
    try {
        const response = await fetch(`${URL}/whoami`);
        const data = response.data();
        if (data.settings) {
            // successfully grabbed settings from the url
            settings = data.settings;
        }
    } catch (e) {
        console.log(`[WARNING]: Failed to fetch settings from ${URL}`)
        if (req.query.settings == undefined) {
            return res.json({"status":false,"error":`Failed to get your settings from ${URL}/whoami or in the query.settings`})
        } else {
            // revert to sent settings (BACKUP)
            settings = req.query.settings;
        }
    }
    console.log(`Just recieved a request with data: ${URL}. Adding to known nodes.`);
    // We just got a URL from another node! Lets add it to our current nodes list.
    const nodes = JSON.parse(fs.readFileSync('./src/nodes.json'));
    for (var index in nodes) {
        if (index == URL) {
            // node already exists! so don't do anything
            console.log(`The node ${URL} already existed on our node.`);
            return res.json({"status": true,"warning": "Node already existed on server."})
        }
    }
    // Save to current nodes list
    nodes[URL] = JSON.parse(settings);
    fs.writeFileSync("./src/nodes.json", JSON.stringify(nodes,null,2));
    console.log(`Successfully added ${URL} to our known nodes.`)
    return res.json({"status": true});
})
app.listen(80, () => {
    const serverData = JSON.parse(fs.readFileSync("./src/config.json"))
    console.log(`Welcome to Starfiles Network!\n\nRunning node updater. This may take a while.`);
    new nodeUpdate.NodeUpdater(JSON.parse(fs.readFileSync("./src/nodes.json"))).updateNodes();
    console.log(`We all ready! Your server is connected at ${serverData.url}:${serverData.port}`)
})
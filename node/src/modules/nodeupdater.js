/*
        Starfiles Network
        This is used to automatically update the nodes settings on startup.
        Created by DwifteJB and QuixThe2nd
*/
import fetch from 'node-fetch';
import { writeFileSync } from 'fs';
export class NodeUpdater {
    constructor(nodes) {
        // nodes will be the list of nodes.
        this.nodes = nodes;
    }
    async updateNodes() {
        let i = 0;
        new Promise(async (resolve,reject) => {
            for(var index in this.nodes) {
                try {
                    const getData = await fetch(`${index}/whoami`);
                    const response = getData.json();
                    this.nodes[index] = response.settings;
                    i++
                } catch (e) {
                    console.log(`[WARNING] Failed to fetch settings from ${index}`)
                }
            }
            writeFileSync(`./src/nodes.json`, JSON.stringify(this.nodes,null,2));
            console.log(`Finished to update ${i} nodes.`)
            resolve(true);
        })

    }
}
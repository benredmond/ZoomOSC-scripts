const {Client, Server} = require('node-osc');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));

//ZoomOSC Server (IN) Config
const zoomOSCServerIp = "127.0.0.1";
const zoomOSCPortIn = 1234;
//ZoomOSC Client (OUT) Config
const zoomOSCClientIp = "127.0.0.1";
const zoomOSCPortOut = 9090;

const clientZoom = new Client(zoomOSCClientIp, zoomOSCPortOut);

const muteNonCohosts = () => {
    let userList = [];
    let usersProcessed = 0;

    const serverZoom = new Server(zoomOSCPortIn, zoomOSCServerIp);

    clientZoom.send('/zoom/update');
    // clientZoom.send('/zoom/include');
    // clientZoom.send('/zoom/list', () => {
    //     userList = [];
    // });

    serverZoom.on('message', (msg) => {
        if (msg[0].split("/")[3] === 'list') {
            usersProcessed++;
            const userRole = msg[7];

            // 1 is host
            // 2 is cohost
            if (userRole === 2)
                userList.push(msg[4]);

            if (usersProcessed === msg[5]) {
                console.log(userList)
                if (userList.length === 0) {
                    console.log("Error: No co-hosts found");
                    serverZoom.close()
                    return;
                }
                clientZoom.send('/zoom/allExcept/zoomID/mute', ...userList)
                serverZoom.close()
            }
        }
        // else if (msg[0] === '/zoomosc/galleryOrder') { // Finished listing users
        //     console.log(userList)
        //     if (userList.length === 0) {
        //         console.log("Error: No co-hosts found");
        //         serverZoom.close()
        //         return;
        //     }
        //     clientZoom.send('/zoom/allExcept/zoomID/mute', ...userList)
        //     serverZoom.close()
        // }
    });
}

const spotlightHandRaised = () => {
    let userList = [];
    let usersProcessed = 0;

    const serverZoom = new Server(zoomOSCPortIn, zoomOSCServerIp);

    clientZoom.send('/zoom/update')
    // clientZoom.send('/zoom/list', () => {
    //     userList = [];
    // });

    serverZoom.on('message', (msg) => {
        if (msg[0].split("/")[3] === 'list') {
            const handRaised = msg[11];
            if (handRaised === 1)
                userList.push(msg[4]);

            if (usersProcessed === msg[5]) {
                console.log(userList)
                if (userList.length === 0) {
                    console.log("Error: Noone with hands raised");
                    serverZoom.close()
                    return;
                }
                for (const zoomID of userList) {
                    clientZoom.send('/zoom/zoomID/addSpot', zoomID)
                }
                serverZoom.close()
            }
        }
    });
}


let userInput = '';
(async () => {
    while (userInput !== 'q') {
        userInput = await prompt('----------------------\nm - mute users except for cohost\ns - spotlight users with hands raised\nq - quit\n----------------------\n');

        if (userInput === 'm') {
            muteNonCohosts();
        } else if (userInput === 's') {
            spotlightHandRaised()
        }
    }
    rl.close()
})()

rl.on('close', () => process.exit(0))

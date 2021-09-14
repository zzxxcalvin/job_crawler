const request = require("request");
const fs = require("fs");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
const schedule = require("node-schedule");

//decide the information about how to sent the email
let mailTransport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'xxx@gmail.com', //for developement , don't really want to show my email
        pass: 'pass',
        //app password for low secure apps.
    },
});

let date = new Date().toISOString()
    .replace(/T/, ' ') // replace T with a space
    .replace(/\..+/, '') // delete the dot and everything after

let mailOptions = {
    from: 'xxx@gmail.com',
    to: 'xxx@gmail.com',
    subject: `有新的徵人文惹 - ${date}`,
    attachments: [{
            filename: 'new.txt',
            path: './new.txt'
        },
        {
            filename: 'old.txt',
            path: './old.txt'
        }
    ]
};

let testMail ={
    from: 'xxx@gmail.com',
    to: 'xxx@gmail.com',
    subject: `測試信 - ${date}`,
    text:'just for test'
};

function CheckNew(error, response, body) {
    if (!error && response.statusCode == 200) {
        // console.log(body);
        let $ = cheerio.load(body);
        target = $(".r-list-container .r-ent");
        let jobs = [];
        // console.log(target.length);
        for (let i = 0; i < target.length; i++) {
            let title = target.eq(i).find('.title a').text().toString();
            let date = target.eq(i).find('.meta .date').text().toString();
            if (title.indexOf("[徵才]") > -1) {
                if (title.indexOf("後端") > -1) {
                    console.log(title + ' ' + date +'\n')
                    let job = title + ' ' + date;
                    jobs.push(job);
                    fs.writeFile("./new.txt", title + ' ' + date +'\n', {
                            encoding: "utf-8",
                            flag: "a"
                        },
                        (err) => {
                            if (err)
                                console.log(err);
                        });
                }
            }
        }
        getOld(jobs);
    } else {
        console.log("something went wrong !");
    }
}

async function getOld(jobs){
    let old;
    await fs.readFile('./old.txt', (err, data) => {
        if (err)
            console.log(err);
        else {
            old = data.toString().split('\n');

            if (jobs.length === 0 || old.length === jobs.length && old.every((data, i) => {
                    return data === jobs[i];
                })) {
                console.log('\n目前沒有新的東東\n');
                let tmp = old.toString().replace(/,/g, '\n');
                console.log('舊的\n\n' + tmp + '\n');
                mailTransport.sendMail(testMail, (err, info) => {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log('Emainl sent : ' + info.response);
                    }
                });
            } else {
                fs.open('./old.txt', 'w', (err) => {
                    if (err)
                        console.log("error");
                });
                let jobs_string = jobs.toString().replace(/,/g, '\n');
                // console.log(test);
                fs.writeFile('./old.txt', jobs_string, (err) => {
                    if (err) {
                        console.log('error');
                    } else {
                        console.log("可能有新工作可以看看歐\n");
                        let tmp = old.toString().replace(/,/g, '\n');
                        console.log('舊的\n\n' + tmp + '\n');
                        console.log('新的\n\n' + jobs_string + '\n');
                        // send email to inform myself about hiring information .
                        mailTransport.sendMail(mailOptions, (err, info) => {
                            if (err) {
                                console.log(err)
                            } else {
                                console.log('Emainl sent : ' + info.response);
                            }
                        });
                    }
                });
            }
        }
    })
};

function writeJobInfo() {
    //clear the "new" file;
    fs.open('./new.txt', 'w', (err) => {
        if (err)
            console.log("error");
    });
    //get the information page and write to the "new" file
    request.get("https://www.ptt.cc/bbs/Soft_Job/index.html", CheckNew);
}

// let rule = new schedule.RecurrenceRule();
// rule.minute = 0;
// rule.hour = 12;

// Set up the rule that it will run at 12 pm every day

// schedule.scheduleJob(rule, writeJobInfo);

writeJobInfo();

//heroku ps:scale web=0 
//use this command to stop heroku app
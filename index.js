const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname + '/views'));

app.use(express.static(path.join(__dirname + '/public')))
app.use(express.urlencoded({ extended: true }));

function convertToHourMinute(str) {
    let hour = parseInt(str.split(':')[0]); //get hours
    let minute = parseInt(str.split(':')[1]);   //get minutes

    if(str[0]=='-'){    //convert minutes to minus if offset is in minus
        minute = parseInt(minute>0 ? '-' + minute : '' + minute)
    }

    return {
        hour: hour ? hour : 0,
        minute: minute ? minute : 0
    }
}
app.get('/', (req, res) => {
    fs.readFile('data.json', 'utf-8', (err, data) => {
        if (err)
            return console.log(err.message);

        res.render('index', {
            addedTime: "",
            convertedTime: "",
            zoneFrom: "",
            zoneTo: "",
            zones: JSON.parse(data)
        });
    });
});

app.post('/convert', (req, res) => {

    const today = new Date();   //get today
    let month = today.getMonth(), date = today.getDate(), year = today.getFullYear();   //get month, year, date
    
    //convert month and date to 2 digit format
    month = (month < 10) ? ('0' + month) : ('' + month);
    date = (date < 10) ? ('0' + date) : ('' + date);

    const sourceTimezone = req.body.zoneFrom;   //get entered timezone
    const sourceDate = new Date(`${year}-${month}-${date}T${req.body.time}:00Z`);   //get entered source date

    const destinationTimezone = req.body.zoneTo;    //get destination timezone

    const utcTime = sourceDate.getTime() + (sourceDate.getTimezoneOffset() * 60000);    //get UTC time

    //get source and destination offsets
    const sourceOffset = convertToHourMinute(sourceDate.toLocaleTimeString('en-us', { timeZoneName: 'short', timeZone: sourceTimezone }).split(' ')[2].slice(3));
    const destinationOffset = convertToHourMinute(sourceDate.toLocaleTimeString('en-us', { timeZoneName: 'short', timeZone: destinationTimezone }).split(' ')[2].slice(3));
    
    //get difference in hour and minutes
    const offsetDifferenceHour = destinationOffset.hour - sourceOffset.hour;

    const offsetDifferenceMinute = destinationOffset.minute - sourceOffset.minute;

    //find the total conversion needed in milliseconds
    const totalConversion = (offsetDifferenceHour * 3600000) + (offsetDifferenceMinute * 60000);
    
    const sourceTime = new Date(utcTime).toLocaleString('en-us');   //get sourcetime for better user experience
    const destinationTime = new Date(utcTime + totalConversion).toLocaleString('en-us');    //get answer

    fs.readFile('data.json', 'utf-8', (err, data) => {
        if (err)
            return console.log(err.message);

        res.render('index', {
            zoneFrom: sourceTimezone,
            zoneTo: destinationTimezone,
            addedTime: sourceTime,
            convertedTime: destinationTime,
            zones: JSON.parse(data)
        });
    });
});

app.use("*", (req, res) => {
    res.redirect('/');
});

app.listen(3000, () => {
    console.log("Server started at port 3000...");
})
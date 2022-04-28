const db = require('../../models');
const _ = require('lodash');
const seq = require('sequelize');
const puppeteer = require('puppeteer');

//to Authenticate the User(Guard);
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        req.user.then(function (result) {

            if (result.role != 'guard') {
                console.log("I AM HERE");
                res.redirect('/');
            }
            else {
                return next();
            }
        });
    }
    else {
        res.redirect('/');
    }
}

//to get the Dashboard (Welcome Screen on login for Guard)
const get_dashboard = async function (req, res) {
    //getting user information (firstname, lastname, email, phonenumber, status, role, user_id)
    var params = await req.user;

    //getting user allocation details
    const allocationDetails = await db.guard_allocations.findAll({
        where: {
            user_id: params.user_id
        }
    });

    var start_day = "NA";
    var stop_day = "NA";
    var patrol_name = "NA";
    var shift_start = "NA";
    var shift_stop = "NA";

    if (allocationDetails.length != 0) {
        //getting the days name for week_start_day and week_stop_day
        start_day = getDayName(allocationDetails[0].week_start_day);
        stop_day = getDayName(allocationDetails[0].week_stop_day);

        //getting patrol Name which is assigned to this particular user
        patrolName = await db.patrols.findOne({
            where: {
                patrol_id: allocationDetails[0].patrol_id
            },
            attributes: [
                'patrol_name'
            ]
        });

        patrol_name = patrolName.patrol_name;
        shift_start = allocationDetails[0].shift_start;
        shift_stop = allocationDetails[0].shift_stop;
    }

    //Rendering the view for dashboard of the user
    res.render('../views/guard/dashboard', { params, shift_start, shift_stop, start_day, stop_day, patrol_name });
}

//function to get report Viewer
const getReportViewer = async function (req, res) {
    res.render('../views/guard/reportViewer');
}

//function to get check-in-Records page
const viewReport = async function (req, res) {
    var startDay = req.query.stDay;
    var endDay = req.query.endDay;
    var pagNo = req.query.pagNo;
    var params = {};
    params.user_id = req.query.gID;

    if (req.query.fname != undefined) {
        params.firstname = req.query.fname;
        params.lastname = req.query.lname;
        params.phonenumber = req.query.phNo;
        params.email = req.query.email;
        params.identification = req.query.iD;
    }

    //creating new variables to store startDay & endDay
    var start_day = endDay;
    var end_day = startDay;

    //making startDay and endDay arrays containing split substrings of startDay & endDay (split using '-')
    startDay = startDay.split("-");
    endDay = endDay.split("-");

    var startDate = new Date();
    var endDate = new Date();

    //in case of startDate is present date and endDate is (1(yesterday),7(week),30(last 30 days))
    if (startDay[0] == 0 && endDay[0] == 0) {
        startDate = new Date();

        //creating string for Till date
        var year = startDate.getUTCFullYear();
        var month = startDate.getUTCMonth() + 1;
        var date = startDate.getUTCDate();
        end_day = year + "-" + month + "-" + date;

        startDate = startDate.setHours(5, 30, 0);
        endDate = new Date(startDate - (endDay[2] * 24 * 60 * 60 * 1000));

        //creating string for From date
        year = endDate.getUTCFullYear();
        month = endDate.getUTCMonth() + 1;
        date = endDate.getUTCDate();
        start_day = year + "-" + month + "-" + date;
    } else {
        //else creating dateTime variables with value of startDay and endDay
        startDate = new Date(startDay[0], startDay[1] - 1, startDay[2]).setHours(5, 30, 0);
        endDate = new Date(endDay[0], endDay[1] - 1, endDay[2]).setHours(5, 30, 0);
    }

    //getting records of checkin for guard with user_id(uid) and between startDate & endDate
    const reportData = await db.guard_clocks.findAll({
        where: {
            [seq.Op.and]: [
                {
                    createdAt: {
                        [seq.Op.lt]: startDate,
                        [seq.Op.gt]: endDate
                    },
                    user_id: params.user_id
                }
            ]
        }
    });

    //getting the patrolNames & checkpointNames using patrolID & checkpointID in records of reportDate
    var patrolName = await getPatrolsName(reportData);
    var checkPointName = await getCheckPointsName(reportData);
    var patrolParams = await getPatrolParameters(reportData);

    if (pagNo == -1) {
        res.render('../views/guard/pdfReport.ejs', { start_day, end_day, params, reportData, patrolName, checkPointName, patrolParams });

    }

    //pagination logic -- showing records using pages
    const pageAsNumber = Number.parseInt(pagNo);
    let page = 0;
    let size = 25; //number of records per page
    if (!Number.isNaN(pageAsNumber) && pageAsNumber > 0) {
        page = pageAsNumber;
    }

    const total = reportData.length;
    const totalPages = Math.ceil(total / Number.parseInt(size));

    res.render('../views/guard/reportView', { reportData, patrolName, checkPointName, page, totalPages, start_day, end_day });
}

//function to get records of check-in from dashboard
const viewReportInit = async function (req, res) {
    var pageNo = req.query.pagNo;
    var start_day = req.query.stDay;
    var end_day = req.query.endDay;
    var data = await req.user;

    var url = "/guard/recordViewer/?stDay=" + start_day + "&endDay=" + end_day + "&pagNo=" + pageNo + "&gID=" + data.user_id;
    res.redirect(url);
}

//function to get records of check-in from check-in details page
const toViewRecord = async function (req, res) {
    var endDay = req.body.start_day;
    var startDay = req.body.end_day;
    var data = await req.user;

    const url = "/guard/recordViewer?stDay=" + startDay + "&endDay=" + endDay + "&pagNo=0&gID=" + data.user_id;
    res.redirect(url);
}

//function to get PatrolName using PatrolIDs
const getPatrolsName = async function (data) {
    var patrolData = await db.patrols.findAll({
        attributes: [
            'patrol_name',
            'patrol_id'
        ]
    });

    var patrolName = new Map();

    for (let i = 0; i < data.length; ++i) {
        var tempPatrolID = data[i].patrol_id;
        for (let j = 0; j < patrolData.length; ++j) {
            if (tempPatrolID == patrolData[j].patrol_id) {
                patrolName.set(tempPatrolID, patrolData[j].patrol_name);
                break;
            }
        }
    }
    return patrolName;
}

//function to get checkpointName using checkpointIDs
const getCheckPointsName = async function (data) {
    var checkPointData = await db.checkpoints.findAll({
        attributes: [
            'checkpoint_name',
            'checkpoint_id'
        ]
    });

    var checkpointName = new Map();

    for (let i = 0; i < data.length; ++i) {
        var tempcheckID = data[i].checkpoint_id;
        for (let j = 0; j < checkPointData.length; ++j) {
            if (tempcheckID == checkPointData[j].checkpoint_id) {
                checkpointName.set(tempcheckID, checkPointData[j].checkpoint_name);
                break;
            }
        }
    }

    return checkpointName;
}

const getPatrolParameters = async function (data) {

    const patrolParamsData = await db.patrol_params.findAll({
    });

    const paramsData = new Map();

    for (let i = 0; i < data.length; ++i) {
        var tempPatrolID = data[i].patrol_id;
        var tempCheckPID = data[i].checkpoint_id;
        for (let j = 0; j < patrolParamsData.length; ++j) {
            if (patrolParamsData[j].patrol_id == tempPatrolID && patrolParamsData[j].checkpoint_id == tempCheckPID) {
                paramsData.set(i, patrolParamsData[j]);
                break;
            }
        }
    }

    return paramsData;
}

//To get the Name of Day of Week
const getDayName = function (day) {
    if (day === 1)
        return "Monday";
    else if (day === 2)
        return "Tuesday";
    else if (day === 3)
        return "Wednesday";
    else if (day === 4)
        return "Thrusday";
    else if (day === 5)
        return "Friday";
    else if (day === 6)
        return "Saturday";
    else
        return "Sunday";
}

const pdfReportGenerate = async function (req, res) {

    var start_d = req.query.start_day;
    var stop_d = req.query.stop_day;

    var params = await req.user;
    var pageNo = -1;

    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        var url = "http://localhost:3000/guard/recordViewer/?stDay=" + start_d + "&endDay=" + stop_d + "&pagNo=" + pageNo + "&gID=" + params.user_id + "&fname=" + params.firstname + "&lname=" + params.lastname +
            "&email=" + params.email + "&iD=" + params.identification + "&phNo=" + params.phonenumber;
        await page.goto(url, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({ format: 'A4', printBackground: true });

        await browser.close();
        res.set("Content-Type", "application/pdf");
        res.send(pdf);

    } catch (err) {
        console.log(err);
    }
}

module.exports = { 
    get_dashboard, isAuthenticated, viewReport, getReportViewer, toViewRecord, viewReportInit, pdfReportGenerate 
};

const express = require('express')
const router = require('express').Router()
const session = require('express-session');

//Linking guardController file to routes
const guardController = require('../../controllers/guard/guardController');

router.get('/dashboard',guardController.isAuthenticated,guardController.get_dashboard);

router.get('/viewReport',guardController.isAuthenticated,guardController.viewReportInit);

router.get('/recordViewer',guardController.viewReport);

router.get('/reportViewer',guardController.isAuthenticated, guardController.getReportViewer);

router.post('/reportViewer',guardController.isAuthenticated, guardController.toViewRecord);

router.post('/printReport',guardController.isAuthenticated,guardController.pdfReportGenerate);

module.exports  = router;



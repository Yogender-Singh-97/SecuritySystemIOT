const router = require('express').Router();
const guardController = require('../../controllers/guard/guardController');

//dashboard
router.get('/dashboard',guardController.isAuthenticated,guardController.get_dashboard);

//Viewing Reports
router.get('/viewReport',guardController.isAuthenticated,guardController.viewReportInit);
router.get('/recordViewer',guardController.viewReport);
router.get('/reportViewer',guardController.isAuthenticated, guardController.getReportViewer);
router.post('/reportViewer',guardController.isAuthenticated, guardController.toViewRecord);

//printing Reports
router.post('/printReport',guardController.isAuthenticated,guardController.pdfReportGenerate);

module.exports  = router;



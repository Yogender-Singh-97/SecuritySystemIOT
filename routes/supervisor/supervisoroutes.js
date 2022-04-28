const router = require('express').Router();
const supervisorcontroller = require('../../controllers/supervisor/supervisorcontroller');

//Guard Management
router.get('/gregister', supervisorcontroller.isAuthenticated, supervisorcontroller.guard_register_get);
router.post('/gsave', supervisorcontroller.isAuthenticated, supervisorcontroller.guard_save);
router.get('/gmanage/:pagen', supervisorcontroller.isAuthenticated, supervisorcontroller.guard_manage);
router.get('/gupdate1/:uid', supervisorcontroller.isAuthenticated, supervisorcontroller.update_guard1);
router.post('/gupdate2', supervisorcontroller.isAuthenticated, supervisorcontroller.update_guard2);
router.get('/gdelete/:uid', supervisorcontroller.isAuthenticated, supervisorcontroller.delete_guard);
router.get('/gdisable/:uid', supervisorcontroller.isAuthenticated, supervisorcontroller.disable_guard);
router.get('/genable/:uid', supervisorcontroller.isAuthenticated, supervisorcontroller.enable_guard);
router.get('/greset/:uid', supervisorcontroller.isAuthenticated, supervisorcontroller.guard_password_reset);

//Checkpoint Management 
router.get('/cregister', supervisorcontroller.isAuthenticated, supervisorcontroller.checkpoint_register_get);
router.post('/csave', supervisorcontroller.isAuthenticated, supervisorcontroller.checkpoint_save);
router.get('/cmanage/:pagen', supervisorcontroller.isAuthenticated, supervisorcontroller.checkpoint_manage);
router.get('/cupdate1/:cid', supervisorcontroller.isAuthenticated, supervisorcontroller.update_checkpoint1);
router.post('/cupdate2', supervisorcontroller.isAuthenticated, supervisorcontroller.update_checkpoint2);
router.get('/cdelete/:cid', supervisorcontroller.isAuthenticated, supervisorcontroller.delete_checkpoint);

//Location Management
router.get('/lregister', supervisorcontroller.isAuthenticated, supervisorcontroller.location_register_get);
router.post('/lsave', supervisorcontroller.isAuthenticated, supervisorcontroller.location_save);
router.get('/lmodify/:pagen', supervisorcontroller.isAuthenticated, supervisorcontroller.location_manage);
router.get('/lupdate1/:lid', supervisorcontroller.isAuthenticated, supervisorcontroller.update_location1);
router.post('/lupdate2', supervisorcontroller.isAuthenticated, supervisorcontroller.update_location2)
router.get('/ldelete/:lid', supervisorcontroller.isAuthenticated, supervisorcontroller.delete_location);

//Patrol Management
router.get('/pregister', supervisorcontroller.isAuthenticated, supervisorcontroller.patrol_register_get);
router.post('/psave', supervisorcontroller.isAuthenticated, supervisorcontroller.patrol_save);
router.get('/pmanage/:pagen', supervisorcontroller.isAuthenticated, supervisorcontroller.patrol_manage);
router.get('/pupdate1/:pid', supervisorcontroller.update_patrol1);
router.post('/pupdate2', supervisorcontroller.isAuthenticated, supervisorcontroller.update_patrol2);
router.get('/pdelete/:pid', supervisorcontroller.isAuthenticated, supervisorcontroller.delete_patrol);
router.get('/gallocation', supervisorcontroller.isAuthenticated, supervisorcontroller.gallocation_get);
router.get('/gmodify/:gid', supervisorcontroller.isAuthenticated, supervisorcontroller.gmodify_get);
router.post('/asave', supervisorcontroller.isAuthenticated, supervisorcontroller.asave);
router.post('/gmodidy_save', supervisorcontroller.isAuthenticated, supervisorcontroller.gmodify_save);

//Reports
router.get('/preport', supervisorcontroller.isAuthenticated, supervisorcontroller.preport_get);
router.get('/pgenerate1/:pid/:start_date/:stop_date/:option/:gid', supervisorcontroller.report_patrol);
router.post('/pgenerate', supervisorcontroller.isAuthenticated, supervisorcontroller.pgenerate);
router.get('/pusers/:pid', supervisorcontroller.isAuthenticated, supervisorcontroller.pusers_get);

//Dashboard
router.get('/sdashboard', supervisorcontroller.isAuthenticated, supervisorcontroller.dashboard_get);
router.get('/dpreport/:pid', supervisorcontroller.isAuthenticated, supervisorcontroller.dpreport_generate);

module.exports = router;


const router = require('express').Router();
const sysadmincontroller = require('../../controllers/system_admin/sysadmincontroller');

//dashboard
router.get('/udashboard', sysadmincontroller.isAuthenticated, sysadmincontroller.user_dashboard_get);

//User Registration
router.get('/uregister', sysadmincontroller.isAuthenticated, sysadmincontroller.user_register_get);
router.post('/save', sysadmincontroller.isAuthenticated, sysadmincontroller.save);

//User Management
router.get('/umanage/:pagen', sysadmincontroller.isAuthenticated, sysadmincontroller.manage);
router.get('/udelete/:uid', sysadmincontroller.isAuthenticated, sysadmincontroller.delete_user);
router.get('/upreset/:uid', sysadmincontroller.isAuthenticated, sysadmincontroller.user_password_reset);
router.get('/udisable/:uid', sysadmincontroller.isAuthenticated, sysadmincontroller.user_disable);
router.get('/uenable/:uid', sysadmincontroller.isAuthenticated, sysadmincontroller.user_enable);
router.get('/uupdate1/:uid', sysadmincontroller.isAuthenticated, sysadmincontroller.update_user1);
router.post('/uupdate2', sysadmincontroller.isAuthenticated, sysadmincontroller.update_user2);

//Changing Password
router.get('/changepassword', sysadmincontroller.isAuthenticated_role, sysadmincontroller.user_change_password_get);
router.post('/changepassword', sysadmincontroller.isAuthenticated_role, sysadmincontroller.user_change_password);

//Role & Login-Logout Handler
router.get('/rolerouter', sysadmincontroller.isAuthenticated_role, sysadmincontroller.user_router);
router.post('/login', sysadmincontroller.login_handler);
router.get('/logout', sysadmincontroller.isAuthenticated, sysadmincontroller.logout_handler);

module.exports = router;



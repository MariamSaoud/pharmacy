const express=require('express');
const router=express();
const userController=require('../controllers/user');
const authenticated=require('../controllers/authentication');
const For_Pharmacist=require('../WhoCanDO/forPharmacist');
const For_User=require('../WhoCanDO/forUser');
//api translate
router.post('/translate',userController.translate);
//authentication
router.post('/sendOTP/:userId',userController.sendOTPverification);
router.post('/signUp',userController.SignUp);
router.post('/verify-OTP/:userId',userController.verifyOTP);
router.post('/login',userController.login);
router.post('/reset-password/:userId',userController.resetPassword);
router.post('/delete-account/:userId',userController.deleteaccount);
router.post('/logout',userController.logout);
//ordering process
router.post('/buy-an-item/:medicineId',authenticated,For_User.forUser,userController.buyAnItem);
router.post('/cancel-order/:orderId',authenticated,For_User.forUser,userController.cancelOrder);
router.post('/enter-location',authenticated,For_User.forUser,userController.location);
//notifications
router.post('/enter-notifications',authenticated,For_User.forUser,userController.notificationWant)
// start of get requests :)
router.get('/search',authenticated,For_User.forUser,userController.search)
router.get('/show-notification',authenticated,For_User.forUser,userController.showNotification)
router.get('/show-home',authenticated,For_User.forUser,userController.showHome)
router.get('/show-prescription/:orderId',authenticated,For_User.forUser,userController.showPrescription)
router.get('/showAltmed',authenticated,For_User.forUser,userController.showAltMed)
module.exports=router;
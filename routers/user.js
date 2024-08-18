const express=require('express');
const router=express();
const userController=require('../controllers/user');
const authenticated=require('../controllers/authentication');
const For_Pharmacist=require('../WhoCanDO/forPharmacist');
const For_User=require('../WhoCanDO/forUser');
const notification=require('../controllers/notification');
//api translate
router.post('/translate',userController.translate);
//authentication
router.post('/sendOTP/:userId',userController.sendOTPverification);
router.post('/signUp',userController.SignUp);
router.post('/verify-OTP/:userId',userController.verifyOTP);
router.post('/login',userController.login);
router.post('/reset-password',userController.resetPassword);
router.post('/delete-account',authenticated,For_User.forUser,userController.deleteaccount);
router.post('/logout',userController.logout);
router.post('/edit-profile',authenticated,For_User.forUser,userController.editProfile)
//ordering process
router.post('/buy-an-item/:medicineId',authenticated,For_User.forUser,userController.buyAnItem);
router.post('/cancel-order/:orderId',authenticated,For_User.forUser,userController.cancelOrder);
router.post('/enter-location',authenticated,For_User.forUser,userController.location);
router.post('/cancel-from-order/:op_relationId',authenticated,For_User.forUser,userController.cancelFromOrder);
//notifications
router.post('/enter-notifications',authenticated,For_User.forUser,notification.notificationWant)
router.delete('/delete-notification/:notificationId',authenticated,For_User.forUser,userController.deleteNotifications)
// start of get requests :)
router.get('/search',authenticated,For_User.forUser,userController.search)
router.get('/show-notification',authenticated,For_User.forUser,userController.showNotification)
router.get('/show-home',authenticated,For_User.forUser,userController.showHome)
router.get('/show-prescription/:orderId',authenticated,For_User.forUser,userController.showPrescription)
router.get('/showAltmed',authenticated,For_User.forUser,userController.showAltMed)
router.get('/orders',authenticated,For_User.forUser,userController.showMedOrdered)
router.get('/profile',authenticated,For_User.forUser,userController.showProfile)
router.get('/findId',authenticated,For_User.forUser,userController.findId)
module.exports=router;
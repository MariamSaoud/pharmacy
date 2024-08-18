const express=require('express');
const router=express();
const pharmacistController=require('../controllers/pharmacist');
const authenticated=require('../controllers/authentication');
const For_Pharmacist=require('../WhoCanDO/forPharmacist');
const For_User=require('../WhoCanDO/forUser');
const notification=require('../controllers/notification')
//api translate
router.post('/translate',pharmacistController.translate);
//authentication
router.post('/sendOTP/:userId',pharmacistController.sendOTPverification);
router.post('/signUp',pharmacistController.signUp);
router.post('/verifyOTP/:userId',pharmacistController.verifyOTP);
router.post('/login',pharmacistController.login);
router.post('/reset-password',pharmacistController.resetPassword);
router.post('/delete-account',authenticated,For_Pharmacist.forPharmacist,pharmacistController.deleteaccount);
router.post('/logout',pharmacistController.logout);
router.post('/edit-profile',authenticated,For_Pharmacist.forPharmacist,pharmacistController.editProfile)
//company
router.post('/add-company',authenticated,For_Pharmacist.forPharmacist,pharmacistController.addCompany);
router.post('/update-company/:companyId',authenticated,For_Pharmacist.forPharmacist,pharmacistController.updateCompanyName);
router.delete('/delete-company/:companyId',authenticated,For_Pharmacist.forPharmacist,pharmacistController.deleteCompany);
//medicine
router.post('/add-medicine/:companyId',authenticated,For_Pharmacist.forPharmacist,pharmacistController.addmedicine);
router.post('/update-price/:medicineId',authenticated,For_Pharmacist.forPharmacist,pharmacistController.updateprice);
router.post('/update-price-percentage',authenticated,For_Pharmacist.forPharmacist,pharmacistController.updatepricepercentage)
router.post('/increase-quantity/:medicineId',authenticated,For_Pharmacist.forPharmacist,pharmacistController.increaseQuantity);
router.delete('/delete-medicine/:medicineId',authenticated,For_Pharmacist.forPharmacist,pharmacistController.deletemedicine);
router.post('/add-medicine-company',authenticated,For_Pharmacist.forPharmacist,pharmacistController.addmedicineCompany)
//alternative_medicine
router.post('/add-alt-med/:medicineId',authenticated,For_Pharmacist.forPharmacist,pharmacistController.addAlternativeMed);
router.post('/update-alt-med/:altmedId',authenticated,For_Pharmacist.forPharmacist,pharmacistController.updateAlteernativeMed);
router.delete('/delete-alt-med/:altmedId',authenticated,For_Pharmacist.forPharmacist,pharmacistController.deleteAlternativeMed);
//confirm_order
router.post('/confirm-order/:orderId',authenticated,For_Pharmacist.forPharmacist,pharmacistController.confirmOrder); 
//notifications
router.post('/notifications',authenticated,For_Pharmacist.forPharmacist,notification.notifications)
router.post('/lowBound-notifications',authenticated,For_Pharmacist.forPharmacist,notification.lowBoundNotifications)
router.delete('/delete-notification/:notificationId',authenticated,For_Pharmacist.forPharmacist,pharmacistController.deleteNotifications)
// start of get requests :)
router.get('/max-selling',authenticated,For_Pharmacist.forPharmacist,pharmacistController.maxSelling)
router.get('/min-selling',authenticated,For_Pharmacist.forPharmacist,pharmacistController.minSelling)
router.get('/show-home',authenticated,For_Pharmacist.forPharmacist,pharmacistController.showHome)
router.get('/Daily-Inventory',authenticated,For_Pharmacist.forPharmacist,pharmacistController.dailyInventory)
router.get('/search',authenticated,For_Pharmacist.forPharmacist,pharmacistController.search)
router.get('/show-notification',authenticated,For_Pharmacist.forPharmacist,pharmacistController.showNotification)
router.get('/show-from-barcode',authenticated,For_Pharmacist.forPharmacist,pharmacistController.showFromBarcode)
router.get('/show-orders',authenticated,For_Pharmacist.forPharmacist,pharmacistController.showOrdersDetails)
router.get('/show-companies',authenticated,For_Pharmacist.forPharmacist,pharmacistController.showCompanies)
router.get('/show-Altmed',authenticated,For_Pharmacist.forPharmacist,pharmacistController.showAltForAllMed)
router.get('/showForMed-Alts/:medicineId',authenticated,For_Pharmacist.forPharmacist,pharmacistController.showAltForMed)
router.get('/profile',authenticated,For_Pharmacist.forPharmacist,pharmacistController.showProfile)
router.get('/findId',authenticated,For_Pharmacist.forPharmacist,pharmacistController.findId)
module.exports=router;
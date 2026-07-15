// Card-payment suite — commented out entirely.
//
// Complete Payment stays DISABLED in card mode until a real card terminal
// reports a successful charge — verified manually against the running app.
// Un-comment once a terminal is wired into the test environment.
//
// import { test, expect } from '@fixtures/index';
// import { Tag } from '@/types/testTags';
// import { STAFF /* , OWNER_PASSCODE */ } from '@data/static/staff';
// import { SERVICES } from '@data/static/services';
//
// test.describe(`Orders — create order with Card ${Tag.REGRESSION} ${Tag.PAYMENT}`, () => {
//   test.beforeEach(async ({ homePage }) => {
//     await homePage.goto();
//   });
//
//   test('creates an order with card payment and reaches the Card screen', async ({
//     homePage,
//     checkoutPage,
//     // passcodeDialog,
//     // paymentSuccessPage,
//   }) => {
//     const staff = STAFF.ELISE_TERRY;
//
//     await test.step('Select staff member', async () => {
//       await homePage.selectStaff(staff.nickname);
//     });
//
//     await test.step('Add services', async () => {
//       await homePage.selectService(SERVICES.GEL_REMOVAL.name);
//       await homePage.selectService(SERVICES.DIPPING_OMBRE.name);
//     });
//
//     await test.step('Navigate to checkout', async () => {
//       await homePage.clickPay();
//     });
//
//     await test.step('Verify order details on checkout', async () => {
//       await checkoutPage.verifyOrderDetails({
//         staffName: staff.nickname,
//         services: [
//           { name: SERVICES.GEL_REMOVAL.name, price: SERVICES.GEL_REMOVAL.price },
//           { name: SERVICES.DIPPING_OMBRE.name, price: SERVICES.DIPPING_OMBRE.price },
//         ],
//       });
//     });
//
//     await test.step('Reach Card screen with order total entered', async () => {
//       await checkoutPage.payByCardForOrderTotal();
//       // expect(await checkoutPage.isCompletePaymentEnabled()).toBe(true);
//     });
//
//     // TODO: re-enable once a real card terminal is available in the test env.
//     // await test.step('Tender card amount and complete', async () => {
//     //   await checkoutPage.clickCompletePayment();
//     // });
//     //
//     // await test.step('Enter passcode and verify success', async () => {
//     //   await passcodeDialog.enterPasscode(OWNER_PASSCODE);
//     //   await paymentSuccessPage.waitForSuccess();
//     //   expect(await paymentSuccessPage.isSuccessful()).toBe(true);
//     //   await paymentSuccessPage.verifyPaymentMethod('Card');
//     // });
//     //
//     // await paymentSuccessPage.clickNoReceipt();
//   });
//
//   test('reaches Card screen for a single-service order', async ({
//     homePage,
//     checkoutPage,
//     // passcodeDialog,
//     // paymentSuccessPage,
//   }) => {
//     const staff = STAFF.AMELIA;
//
//     await homePage.selectStaff(staff.nickname);
//     await homePage.selectService(SERVICES.ACRYLIC_REMOVAL.name);
//
//     await homePage.clickPay();
//
//     await checkoutPage.payByCardForOrderTotal();
//     // expect(await checkoutPage.isCompletePaymentEnabled()).toBe(true);
//
//     // TODO: re-enable once a real card terminal is available in the test env.
//     // await checkoutPage.clickCompletePayment();
//     // await passcodeDialog.enterPasscode(OWNER_PASSCODE);
//     // await paymentSuccessPage.waitForSuccess();
//     // expect(await paymentSuccessPage.isSuccessful()).toBe(true);
//     // await paymentSuccessPage.verifyPaymentMethod('Card');
//     // await paymentSuccessPage.clickNoReceipt();
//   });
//
//   test('reaches Card screen for a multi-service order', async ({
//     homePage,
//     checkoutPage,
//     // passcodeDialog,
//     // paymentSuccessPage,
//   }) => {
//     const staff = STAFF.LUNA;
//
//     await homePage.selectStaff(staff.nickname);
//     await homePage.selectService(SERVICES.WAXING_LIP_CHIN.name);
//     await homePage.selectService(SERVICES.SPA_SERVICE.name);
//
//     await homePage.clickPay();
//
//     await checkoutPage.verifyOrderDetails({
//       staffName: staff.nickname,
//       services: [
//         { name: SERVICES.WAXING_LIP_CHIN.name, price: SERVICES.WAXING_LIP_CHIN.price },
//         { name: SERVICES.SPA_SERVICE.name, price: SERVICES.SPA_SERVICE.price },
//       ],
//     });
//
//     await checkoutPage.payByCardForOrderTotal();
//     // expect(await checkoutPage.isCompletePaymentEnabled()).toBe(true);
//
//     // TODO: re-enable once a real card terminal is available in the test env.
//     // await checkoutPage.clickCompletePayment();
//     // await passcodeDialog.enterPasscode(OWNER_PASSCODE);
//     // await paymentSuccessPage.waitForSuccess();
//     // await paymentSuccessPage.verifyPaymentMethod('Card');
//     // await paymentSuccessPage.clickNoReceipt();
//   });
//
//   test('switches from Cash to Card before reaching the Card screen', async ({
//     homePage,
//     checkoutPage,
//     // passcodeDialog,
//     // paymentSuccessPage,
//   }) => {
//     const staff = STAFF.EMMA2;
//
//     await homePage.selectStaff(staff.nickname);
//     await homePage.selectService(SERVICES.GEL_REMOVAL.name);
//     await homePage.clickPay();
//
//     await test.step('Initially pick Cash', async () => {
//       await checkoutPage.selectPaymentMethod('Cash');
//       expect(await checkoutPage.isCompletePaymentEnabled()).toBe(true);
//     });
//
//     await test.step('Switch to Card and verify amount screen ready', async () => {
//       await checkoutPage.payByCardForOrderTotal();
//       // expect(await checkoutPage.isCompletePaymentEnabled()).toBe(true);
//     });
//
//     // TODO: re-enable once a real card terminal is available in the test env.
//     // await checkoutPage.clickCompletePayment();
//     // await passcodeDialog.enterPasscode(OWNER_PASSCODE);
//     // await paymentSuccessPage.waitForSuccess();
//     // await paymentSuccessPage.verifyPaymentMethod('Card');
//     // await paymentSuccessPage.clickNoReceipt();
//   });
//
//   test('records a video of reaching the Card amount screen', async ({
//     homePage,
//     checkoutPage,
//     // passcodeDialog,
//     // paymentSuccessPage,
//   }) => {
//     // Plain happy-path with a different staff — useful as a "recorded reference"
//     // for the dashboard so reviewers can replay the card flow up to tender.
//     const staff = STAFF.ISABELLA;
//
//     await homePage.selectStaff(staff.nickname);
//     await homePage.selectService(SERVICES.BLACK_WHITE_FULL_SET.name);
//
//     await homePage.clickPay();
//
//     await checkoutPage.payByCardForOrderTotal();
//     // expect(await checkoutPage.isCompletePaymentEnabled()).toBe(true);
//
//     // TODO: re-enable once a real card terminal is available in the test env.
//     // await checkoutPage.clickCompletePayment();
//     // await passcodeDialog.enterPasscode(OWNER_PASSCODE);
//     // await paymentSuccessPage.waitForSuccess();
//     // await paymentSuccessPage.verifyPaymentMethod('Card');
//     // await paymentSuccessPage.clickNoReceipt();
//   });
// });

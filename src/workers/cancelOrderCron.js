// Run every 15 minutes
const cron = require('node-cron');
const { cancelAndRestockExpiredOrders } = require('../helper/productHelper');


cron.schedule('*/1 * * * *', async () => {
    await cancelAndRestockExpiredOrders();
    console.log('Expired orders checked and processed.');
});
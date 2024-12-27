const express = require("express");
const router = express.Router();
const getExpenseModel = require("../models/expense");

router.get('/', (req, res) => {
    console.log("home rendering");
    res.render('home', { email: req.session.user.email }); 
});

router.get('/dashboard', async (req, res) => {
    const email = req.session.user.email;
    console.log(email);
    const Expense = getExpenseModel(email);
  
    try {
        // Fetch total expenses
        const total = await Expense.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Fetch expense trend data for line chart
        const expenseTrend = await Expense.aggregate([
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, total: { $sum: "$amount" } } },
            { $sort: { _id: 1 } } // Sort by date
        ]);

        // Fetch data for pie chart grouped by purpose
        const expenseByPurpose = await Expense.aggregate([
            { $group: { _id: "$purpose", total: { $sum: "$amount" } } }
        ]);

        res.status(200).json({
            total: total[0]?.total || 0, // Total expenses
            expenseTrend, // Expense trend data for line chart
            expenseByPurpose // Expense data for pie chart
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;


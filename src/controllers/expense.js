const Expense = require('../models/expense');
const DataSourceResult = require('../models/DataSourceResult');
let dataSourceResult = new DataSourceResult();
/**
 * Creates an income
 * @param {*} req request
 * @param {*} res response
 * @param {*} next 
 */
exports.createExpense = (req, res, next) => {
    if (req.body._id) {
        const expense = new Expense({
            title: req.body.title,
            description: req.body.description,
            amount: req.body.amount,
            category: req.body.category,
            account: req.body.account,
            creator: req.userData.userId ? req.userData.userId : null,
            _id: req.body._id
        });
        const options = { upsert: false };
        expense.updateOne(expense, options).then((data) => {
            res.status(200).json({
                Data: data,
                id: data._id,
            });
        }).catch(err => {
            res.status(500).json({
                message: err.message
            })
        });
    } else {
        const expense = new Expense({
            title: req.body.title,
            description: req.body.description,
            amount: req.body.amount,
            category: req.body.category,
            account: req.body.account,
            creator: req.userData.userId
        });
        expense.save().then(expense => {
            dataSourceResult.toDataSourceResult(expense);
            res.status(201).json(dataSourceResult);
        }).catch(err => {
            res.status(500).json({
                message: err.message
            })
        });
    }
};

/**
 * Retrieves expenses since the beginning of the month
 * @param {*} req request
 * @param {*} res response
 * @param {*} next next
 */
exports.retrieveExpenses = (req, res, next) => {
    const today = new Date();
    const monthBeginning = new Date(today.getFullYear(), today.getMonth(), 1);
    const fieldSort = req.query.sort;
    let arraySort = (fieldSort != undefined ? fieldSort : "").split("~");
    let sortJson = {};
    arraySort.forEach(e => {
        if (e != '') {
            let arrayPrmSort = e.split("-");
            let sortType = arrayPrmSort[1] == "asc" ? 1 : -1;
            sortJson[arrayPrmSort[0]] = sortType;
        }
    });

    const pageSize = + req.query.pageSize;
    const currentPage = + req.query.page;
    const expenseQuery = Expense.find({ creator: req.userData.userId, $lt: monthBeginning }).sort(sortJson);
    let fetchedExpenses;
    if (currentPage && pageSize) {
        expenseQuery.skip(pageSize * (currentPage - 1)).limit(pageSize);
    }
    expenseQuery.then(documents => {
        fetchedExpenses = documents;
        return Expense.find({ creator: req.userData.userId, $lt: monthBeginning }).count();
    }).then(count => {
        dataSourceResult.toDataSourceResult(fetchedExpenses)
        res.status(200).json(
            dataSourceResult
            // {
            //     expenses: fetchedExpenses,
            //     maxExpenses: count,
            //     since: monthBeginning
            // }
        );
    }).catch(err => {
        res.status(500).json({
            message: err.message
        });
    });
};
/**
 * Remove Expenses
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.removeExpense = (req, res, next) => {
    const id = req.body.id;
    Expense.findByIdAndDelete({ _id: id }).then(data => {
        dataSourceResult.toDataSourceResult(data)
        res.status(200).json(dataSourceResult);
    }).catch(err => {
        res.status(500).json({
            message: err.message
        })
    });
};
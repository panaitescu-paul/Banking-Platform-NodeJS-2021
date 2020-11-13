// Functions folder: npm start

module.exports = async function (context, req) {
    const money = (req.query.money || (req.body && req.body.money));
    if (money < 0 ){
        context.res = {
            status: 404,
            body: "Error! The amount can't be negative!"
        };
    }
    const taxPercentage = 0.10;
    const taxMoney = parseFloat(money) * taxPercentage;
    context.res = {
        status: 200,
        body: taxMoney
    };
}

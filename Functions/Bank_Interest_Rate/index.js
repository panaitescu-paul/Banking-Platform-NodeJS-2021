module.exports = async function (context, req) {
    const depositAmount = (req.query.depositAmount || (req.body && req.body.depositAmount));
    const interestRate = depositAmount * 0.02;
    const newDepositAmount = depositAmount + interestRate;
    context.res = {
        status: 200,
        body: newDepositAmount
    };
}
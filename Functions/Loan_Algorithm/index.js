module.exports = async function (context, req) {

    const loan = (req.query.loan || (req.body && req.body.loan));
    const totalAccountAmount = (req.query.totalAccountAmount || (req.body && req.body.totalAccountAmount));

    console.log('loan', loan);
    console.log('totalAccountAmount', totalAccountAmount);

    if (loan > totalAccountAmount * 0.75) {
        context.res = {
            status: 403
        };
    } else {
        context.res = {
            status: 200
        };
    }
}

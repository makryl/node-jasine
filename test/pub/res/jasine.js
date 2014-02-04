module.exports = function(req, res, callback) {
    res.setHeader(
        'Content-type', 'application/javascript'
    );
    callback();
};

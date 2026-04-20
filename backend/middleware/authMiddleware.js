const jwt = require('jsonwebtoken');
const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'No token provided. Authorization denied.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // payload: { id: user._id, role: user.role }
        next();
    } catch (err) {
        return res.status(401).json({ msg: 'Token is invalid or expired.' });
    }
};

module.exports = protect;

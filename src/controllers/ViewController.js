// [LOKASI]: src/controllers/viewController.js
const User = require('../models/User');

exports.renderIndex = async (req, res) => {
    try {
        // Menarik data staf dari MongoDB untuk bagian "Tim Professional"
        const staffList = await User.find({ 
            role: { $in: ['admin', 'mekanik', 'kasir'] } 
        }).limit(4);

        res.render('index', { 
            title: 'ACR Motor', 
            staffList: staffList, // Kirim data staf ke EJS
            activePage: 'home' 
        });
    } catch (error) {
        console.error("Error render index:", error);
        res.render('index', { title: 'ACR Motor', staffList: [], activePage: 'home' });
    }
};
const Profile = require('../models/Profile');
const RoomAllocation = require('../models/RoomAllocation');

exports.getDashboardData = async (req, res) => {
    try {
        const { email } = req.params;
        
        // 1. Check if student has submitted form
        const profile = await Profile.findOne({ user_id: email });
        if (!profile) {
            return res.json({ status: 'NOT_SUBMITTED', message: 'You have not submitted the preference form.' });
        }
        
        // 2. Check if student is allocated
        const allocation = await RoomAllocation.findOne({ members: email });
        if (allocation) {
            // Find details of roommates
            const roommatesList = allocation.members.filter(m => m !== email);
            const roommatesDocs = await Profile.find({ user_id: { $in: roommatesList } });
            
            return res.json({
                status: 'ALLOCATED',
                room_id: allocation._id,
                room_number: allocation.room_number || allocation.allocation_run_id,
                roommates: roommatesDocs.map(r => ({
                    name: r.name,
                    email: r.user_id,
                    branch: r.branch,
                    year: r.year_of_study
                }))
            });
        }
        
        // 3. Not allocated yet
        return res.json({ status: 'PENDING_ALLOCATION', message: 'Allocation in progress. Please wait.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

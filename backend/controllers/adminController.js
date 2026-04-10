const axios = require('axios');
const csv = require('csv-parser');
const Profile = require('../models/Profile');
const RoomAllocation = require('../models/RoomAllocation');
const ChangeRequest = require('../models/ChangeRequest');
const { runPythonAllocation } = require('../services/allocationService');

exports.syncCsv = async (req, res) => {
    try {
        let { sheet_url } = req.body;
        if (!sheet_url) return res.status(400).json({ error: 'CSV sheet_url is required' });

        sheet_url = sheet_url.trim();
        if (sheet_url.includes("/edit") || sheet_url.includes("/view")) {
            sheet_url = sheet_url.replace(/\/(edit|view).*$/, "/export?format=csv");
        } else if (sheet_url.includes("/pubhtml")) {
            sheet_url = sheet_url.replace("/pubhtml", "/pub");
            if (!sheet_url.includes("output=csv")) sheet_url += (sheet_url.includes("?") ? "&" : "?") + "output=csv";
        } else if (sheet_url.includes("/pub") && !sheet_url.includes("output=csv")) {
            sheet_url += (sheet_url.includes("?") ? "&" : "?") + "output=csv";
        } else if (!sheet_url.includes("format=csv") && !sheet_url.includes("output=csv")) {
            sheet_url += (sheet_url.endsWith("/") ? "" : "/") + "export?format=csv";
        }

        const response = await axios.get(sheet_url, { responseType: 'stream' });

        if (response.headers['content-type'] && response.headers['content-type'].includes('text/html')) {
            return res.status(400).json({ error: 'URL Error', details: 'Google returned an HTML webpage instead of a raw CSV.' });
        }

        const results = [];
        response.data.pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                const profilesToUpsert = results.map((row, index) => {
                    const keys = Object.keys(row);
                    const emailKey = keys.find(k => k.toLowerCase().includes('email'));
                    const nameKey = keys.find(k => k.toLowerCase().includes('name'));
                    const branchKey = keys.find(k => k.toLowerCase().includes('branch'));
                    
                    const email = emailKey && row[emailKey] ? row[emailKey].trim() : `student_${index}@sitpune.edu.in`;
                    if(!email) return null;

                    const fallbackName = nameKey && row[nameKey] ? row[nameKey] : email.split('@')[0];
                    
                    return {
                        updateOne: {
                            filter: { user_id: email },
                            update: {
                                $set: {
                                    user_id: email,
                                    name: fallbackName,
                                    branch: branchKey ? row[branchKey] : "Unknown",
                                    gender: row["Gender"] || row["gender"] || "Other",
                                    year_of_study: row["Year of Study"] || "1st Year",
                                    sleep_time: row["When do you usually sleep?"],
                                    wake_time: row["When do you usually wake up?"],
                                    cleanliness: row["How clean do you keep your room?"],
                                    smoking_habit: row["Do you smoke?"],
                                    drinking_habit: row["Do you drink alcohol?"],
                                }
                            },
                            upsert: true
                        }
                    };
                }).filter(p => p !== null);

                if (profilesToUpsert.length > 0) {
                    await Profile.deleteMany({});
                    await Profile.bulkWrite(profilesToUpsert);
                    // Only delete NOT locked ones from RoomAllocation if resetting
                    await RoomAllocation.deleteMany({ isLocked: { $ne: true } });
                }
                
                res.json({ message: `Successfully synced ${profilesToUpsert.length} profiles from CSV.` });
            });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to sync CSV', details: error.message });
    }
};

exports.triggerAllocation = async (req, res) => {
    try {
        const allProfiles = await Profile.find({});
        
        // Find existing locked allocations to EXCLUDE them
        const lockedAllocations = await RoomAllocation.find({ isLocked: true });
        const lockedMembers = new Set();
        lockedAllocations.forEach(r => {
            if (r.members) {
                r.members.forEach(m => lockedMembers.add(m));
            }
        });

        // Filter out profiles that are already allocated AND locked
        const activeProfiles = allProfiles.filter(p => !lockedMembers.has(p.user_id));

        if (activeProfiles.length < 3 && allProfiles.length > 0) {
            return res.json({ message: 'No enough active unassigned students to form a new room.' });
        }
        
        const profilesJson = activeProfiles.map(p => ({
            user_id: p.user_id,
            name: p.name || 'Unknown',
            age: p.age || 18,
            gender: p.gender || 'F',
            year_of_study: p.year_of_study || '1st Year',
            branch: p.branch || 'CSE',
            sleep_time: p.sleep_time || '10 pm to 12 am',
            wake_time: p.wake_time || '6-8 am',
            cleanliness: p.cleanliness || 'Moderately Clean',
            study_env: p.study_env || 'Light Background Noise',
            guest_frequency: p.guest_frequency || 'Occasionally',
            smoking_habit: p.smoking_habit || 'No',
            drinking_habit: p.drinking_habit || 'No',
            loud_alarms: p.loud_alarms || 'No',
            first_time_hostel: p.first_time_hostel || 'No',
            temp_preference: p.temp_preference || 'Doesn’t matter',
            study_hours: p.study_hours || '2-4',
            active_late: p.active_late || 'No',
            conflict_style: p.conflict_style || 'Talk directly and resolve',
            room_org: p.room_org || 'Flexible',
            noise_tolerance: p.noise_tolerance || 3,
            introversion: p.introversion || 3,
            irritation: p.irritation || 3,
            personal_space: p.personal_space || 3,
            fixed_routines: p.fixed_routines || 3,
            sharing_comfort: p.sharing_comfort || 3,
            pref_roommate_sleep: p.pref_roommate_sleep || 'Does not matter',
            pref_roommate_social: p.pref_roommate_social || 'Does not matter',
            cleanliness_expectation: p.cleanliness_expectation || 'Moderately Clean',
            light_preference: p.light_preference || 'Dim light is fine',
            most_important_factor: p.most_important_factor || 'Cleanliness and Organization'
        }));
        
        const girlsFY = [];
        const girlsSenior = [];
        const boysAll = [];

        profilesJson.forEach(p => {
            const isFemale = p.gender.toLowerCase() === 'f' || p.gender.toLowerCase() === 'female';
            if (isFemale) {
                if (p.year_of_study === '1st Year') {
                    girlsFY.push(p);
                } else {
                    girlsSenior.push(p);
                }
            } else {
                boysAll.push(p);
            }
        });

        const runPool = async (pool) => {
            if (pool.length === 0) return { allocations: [], unassigned_ids: [] };
            return await runPythonAllocation(pool);
        };

        // Execute sequentially to avoid memory spikes on the Python backend!
        const resGFY = await runPool(girlsFY);
        const resGSenior = await runPool(girlsSenior);
        const resBoys = await runPool(boysAll);

        let allUnassigned = [
            ...(resGFY.unassigned_ids || []),
            ...(resGSenior.unassigned_ids || []),
            ...(resBoys.unassigned_ids || [])
        ];

        const CAPACITY_PER_ROOM = 3;
        const ROOMS_PER_FLOOR = 8;
        const FLOORS_PER_BLOCK = 4;

        // Determine offset for numbering so we don't overlap with locked rooms
        let nextIds = { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1, G: 1 };
        
        const assignRoom = (allowedBlocks) => {
            for (let blockId of allowedBlocks) {
                // simple linear increment for demo
                let id = nextIds[blockId]++;
                let f = Math.floor(id / ROOMS_PER_FLOOR) + 1;
                let r = (id % ROOMS_PER_FLOOR) + 1;
                const roomNumber = `${blockId}-${f}0${r}`;
                return { block: blockId, floor: f, room_number: roomNumber };
            }
            return null; 
        };

        const newAllocations = [];
        
        const processResults = (result, allowedBlocks) => {
            if (!result || !result.allocations) return;
            for (let alloc of result.allocations) {
                const roomData = assignRoom(allowedBlocks);
                if (roomData) {
                    newAllocations.push({
                        allocation_run_id: result.run_id || 'manual_id',
                        gender_group: alloc.gender_group,
                        compatibility_score: alloc.compatibility_score,
                        members: alloc.members,
                        block: roomData.block,
                        floor: roomData.floor,
                        room_number: roomData.room_number,
                        isLocked: false // Default to false
                    });
                } else {
                    allUnassigned.push(...alloc.members);
                }
            }
        };

        processResults(resGFY, ['A']);
        processResults(resGSenior, ['B', 'C']);
        processResults(resBoys, ['D', 'E', 'F', 'G']);

        // Delete all UNLOCKED previous allocations
        await RoomAllocation.deleteMany({ isLocked: { $ne: true } });
        await RoomAllocation.insertMany(newAllocations);

        res.json({
            message: 'Allocation completed successfully',
            total_new_rooms: newAllocations.length,
            unassigned: allUnassigned.length,
            unassigned_ids: allUnassigned
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Allocation failed', message: error.message });
    }
};

exports.downloadReport = async (req, res) => {
    try {
        const allocs = await RoomAllocation.find({}).lean();
        const profiles = await Profile.find({}).lean();
        
        const profileMap = {};
        profiles.forEach(p => profileMap[p.user_id] = p);
        
        let csvContent = "Room Number,Block,Floor,Compatibility Score,Member Emails,Member Names,Member Branches\n";
        
        for (let a of allocs) {
            const memberNames = a.members.map(email => profileMap[email] ? profileMap[email].name : 'Unknown');
            const memberBranches = a.members.map(email => profileMap[email] ? profileMap[email].branch : 'Unknown');
            
            const row = [
                a.room_number,
                a.block,
                a.floor,
                a.compatibility_score || 'N/A',
                `"${a.members.join(', ')}"`,
                `"${memberNames.join(', ')}"`,
                `"${memberBranches.join(', ')}"`
            ];
            csvContent += row.join(",") + "\n";
        }
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="Hostel_Allocation_Report.csv"');
        res.status(200).send(csvContent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed' });
    }
};

exports.getAllocations = async (req, res) => {
    try {
        const allocs = await RoomAllocation.find({}).lean();
        const allProfiles = await Profile.find({}).lean();
        
        const profileMap = new Map();
        allProfiles.forEach(p => profileMap.set(p.user_id, p));

        let allocatedEmails = new Set();
        for(let a of allocs) {
            a.memberDetails = a.members.map(email => {
                allocatedEmails.add(email);
                const p = profileMap.get(email);
                return p ? `${p.name} (${p.branch})` : email;
            });
        }

        const unassignedProfiles = allProfiles.filter(p => !allocatedEmails.has(p.user_id));
        const unassigned = unassignedProfiles.map(p => `${p.name} (${p.branch})`);

        res.json({ allocations: allocs, unassigned: unassigned });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch allocations' });
    }
};

exports.manualSwap = async (req, res) => {
    try {
        const { roomAId, memberA, roomBId, memberB } = req.body;
        const validIdA = roomAId.match(/^[0-9a-fA-F]{24}$/) ? roomAId : null;
        const validIdB = roomBId.match(/^[0-9a-fA-F]{24}$/) ? roomBId : null;
        
        const roomA = await RoomAllocation.findOne({ $or: [{ room_number: roomAId }, { _id: validIdA }] });
        const roomB = await RoomAllocation.findOne({ $or: [{ room_number: roomBId }, { _id: validIdB }] });
        
        if (!roomA || !roomB) {
            return res.status(404).json({ error: 'Room not found. Make sure to use exact Room Number (e.g. D-101).' });
        }

        if (roomA.isLocked) return res.status(400).json({ error: `Room ${roomA.room_number} is locked and cannot be modified.` });
        if (roomB.isLocked) return res.status(400).json({ error: `Room ${roomB.room_number} is locked and cannot be modified.` });


        const exactMemberA = roomA.members.find(m => m.includes(memberA));
        const exactMemberB = roomB.members.find(m => m.includes(memberB));

        if (!exactMemberA) return res.status(400).json({ error: `Could not find ${memberA} inside Room ${roomA.room_number}` });
        if (!exactMemberB) return res.status(400).json({ error: `Could not find ${memberB} inside Room ${roomB.room_number}` });
        
        roomA.members = roomA.members.filter(m => m !== exactMemberA);
        roomA.members.push(exactMemberB);
        
        roomB.members = roomB.members.filter(m => m !== exactMemberB);
        roomB.members.push(exactMemberA);
        
        await roomA.save();
        await roomB.save();
        
        res.json({ message: 'Swap completed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Swap failed internally' });
    }
}

exports.toggleRoomLock = async (req, res) => {
    try {
        const { roomId, isLocked } = req.body;
        await RoomAllocation.findByIdAndUpdate(roomId, { isLocked: isLocked });
        res.json({ message: `Room ${isLocked ? 'locked' : 'unlocked'}` });
    } catch (err) {
        res.status(500).json({ error: 'Locking failed' });
    }
}

exports.getChangeRequests = async (req, res) => {
    try {
        const reqs = await ChangeRequest.find({}).populate('currentRoomId').sort({ createdAt: -1 }).lean();
        
        for (let r of reqs) {
             const actualRoom = await RoomAllocation.findOne({ members: r.studentId });
             if (actualRoom) {
                 r.actualRoomNumber = actualRoom.room_number || actualRoom.allocation_run_id;
                 r.actualRoomId = actualRoom._id;
             }
        }
        res.json(reqs);
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
}

exports.handleRequestAction = async (req, res) => {
    try {
        const { requestId, status } = req.body;
        const cReq = await ChangeRequest.findByIdAndUpdate(requestId, { status }, { new: true });
        res.json({ message: `Request ${status}`, data: cReq });
    } catch(err) {
        res.status(500).json({ error: 'Failed' });
    }
}

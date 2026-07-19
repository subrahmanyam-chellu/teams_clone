const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

const dbUri = process.env.DB_URI;
console.log('Connecting to DB:', dbUri);

async function run() {
    try {
        await mongoose.connect(dbUri);
        console.log('Connected!');

        const Messages = require('../../backend/src/models/Messages');
        const Rooms = require('../../backend/src/models/Rooms');
        const User = require('../../backend/src/models/User');

        const rooms = await Rooms.find().limit(5);
        console.log('\n--- Rooms ---');
        console.log(rooms.map(r => ({ id: r._id, name: r.roomName, members: r.members })));

        if (rooms.length > 0) {
            const roomId = rooms[0]._id;
            console.log(`\n--- Messages for Room ${roomId} ---`);
            const messages = await Messages.find({ roomId })
                .populate("sender", "firstName lastName email profilePicture username")
                .populate({
                    path: "parentMessageId",
                    populate: {
                        path: "sender",
                        select: "firstName lastName email profilePicture username"
                    }
                })
                .sort({ createdAt: -1 })
                .limit(10);
            console.log(JSON.stringify(messages, null, 2));
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();

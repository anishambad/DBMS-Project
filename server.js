// backend/server.js

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
// 💡 NEW: Import the path module
const path = require('path'); 

const app = express();
const PORT = 5000; 

// --- MIDDLEWARE ---
app.use(cors()); 
app.use(express.json());

// 💥 CRITICAL FIX: Use path.join to correctly reference the frontend folder one level up (..)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// --- MYSQL DATABASE CONNECTION ---
// ... rest of your code ...

// --- MYSQL DATABASE CONNECTION ---
const db = mysql.createConnection({
    host: 'localhost', 
    user: 'root',
    password: 'password', // <--- CRITICAL: CHANGE THIS TO YOUR ACTUAL MYSQL PASSWORD
    database: 'e_commerce' // <--- CRITICAL: CHANGE THIS TO YOUR ACTUAL DATABASE NAME
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err.stack);
        return;
    }
    console.log('✅ Connected to MySQL Database as ID:', db.threadId);
});

// CRITICAL FIX: Removed the conflicting app.get('/') route, allowing index.html to load.


// ======================================================================
// === EMERGENCY_EVENT CRUD ROUTES ======================================
// ======================================================================

// --- 1. API ROUTE: GET All Emergency Events (READ) ---
app.get('/api/events', async (req, res) => {
    const query = 'SELECT EMG_ID, DISASTER_TYPE, START_DATE FROM EMERGENCY_EVENT'; 
    
    try {
        const [results] = await db.promise().query(query);
        res.status(200).json(results); 
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ error: 'Database query failed', details: err.message });
    }
});

// --- 2. API ROUTE: CREATE New Emergency Event (POST) ---
app.post('/api/events', async (req, res) => {
    const { DISASTER_TYPE, START_DATE } = req.body; 
    const query = 'INSERT INTO EMERGENCY_EVENT (DISASTER_TYPE, START_DATE) VALUES (?, ?)';
    
    try {
        const [results] = await db.promise().query(query, [DISASTER_TYPE, START_DATE]);
        res.status(201).json({ message: 'Emergency Event created successfully', id: results.insertId });
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).json({ error: 'Failed to create event', details: err.message });
    }
});

// --- 3. API ROUTE: UPDATE Emergency Event by ID (PUT) ---
app.put('/api/events/:id', async (req, res) => {
    const eventId = req.params.id;
    const { DISASTER_TYPE, START_DATE } = req.body; 
    const query = 'UPDATE EMERGENCY_EVENT SET DISASTER_TYPE = ?, START_DATE = ? WHERE EMG_ID = ?';
    
    try {
        const [results] = await db.promise().query(query, [DISASTER_TYPE, START_DATE, eventId]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Event not found or no changes made.' });
        }
        res.status(200).json({ message: `Event ID ${eventId} updated successfully` });
    } catch (err) {
        console.error('Error updating event:', err);
        res.status(500).json({ error: 'Failed to update event', details: err.message });
    }
});

// --- 4. API ROUTE: DELETE Emergency Event by ID (DELETE) ---
app.delete('/api/events/:id', async (req, res) => {
    const eventId = req.params.id;
    const query = 'DELETE FROM EMERGENCY_EVENT WHERE EMG_ID = ?'; 
    
    try {
        const [results] = await db.promise().query(query, [eventId]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Event not found.' });
        }
        res.status(200).json({ message: `Event ID ${eventId} deleted successfully` });
    } catch (err) {
        console.error('Error deleting event:', err);
        res.status(500).json({ error: 'Failed to delete event (check for child dependencies)', details: err.message });
    }
});


// ======================================================================
// === RESOURCES CRUD ROUTES (FINAL FIXES FOR RESOURCE_TYPE & LOCATION) =
// ======================================================================

// --- 5. API ROUTE: GET All Resources (READ) ---
app.get('/api/resources', async (req, res) => {
    const query = 'SELECT RES_ID, RESOURCE_TYPE, QUANTITY, LOCATION FROM RESOURCES'; 
    try {
        const [results] = await db.promise().query(query);
        res.status(200).json(results);
    } catch (err) {
        console.error('Error fetching resources:', err);
        res.status(500).json({ error: 'Database query failed', details: err.message });
    }
});

// --- 6. API ROUTE: CREATE New Resource (POST) ---
app.post('/api/resources', async (req, res) => {
    const { RESOURCE_TYPE, QUANTITY, LOCATION } = req.body; 
    const query = 'INSERT INTO RESOURCES (RESOURCE_TYPE, QUANTITY, LOCATION) VALUES (?, ?, ?)';
    try {
        // FIX: Removed duplicate query execution
        const [results] = await db.promise().query(query, [RESOURCE_TYPE, QUANTITY, LOCATION]);
        res.status(201).json({ message: 'Resource created successfully', id: results.insertId });
    } catch (err) {
        console.error('Error creating resource:', err);
        res.status(500).json({ error: 'Failed to create resource', details: err.message });
    }
});

// --- 7. API ROUTE: UPDATE Resource by ID (PUT) ---
app.put('/api/resources/:id', async (req, res) => {
    const resourceId = req.params.id;
    const { RESOURCE_TYPE, QUANTITY, LOCATION } = req.body; 
    const query = 'UPDATE RESOURCES SET RESOURCE_TYPE = ?, QUANTITY = ?, LOCATION = ? WHERE RES_ID = ?';
    try {
        const [results] = await db.promise().query(query, [RESOURCE_TYPE, QUANTITY, LOCATION, resourceId]);
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Resource not found or no changes made.' });
        }
        res.status(200).json({ message: `Resource ID ${resourceId} updated successfully` });
    } catch (err) {
        console.error('Error updating resource:', err);
        res.status(500).json({ error: 'Failed to update resource', details: err.message });
    }
});

// --- 8. API ROUTE: DELETE Resource by ID (DELETE) ---
app.delete('/api/resources/:id', async (req, res) => {
    const resourceId = req.params.id;
    const query = 'DELETE FROM RESOURCES WHERE RES_ID = ?'; 
    try {
        const [results] = await db.promise().query(query, [resourceId]);
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Resource not found.' });
        }
        res.status(200).json({ message: `Resource ID ${resourceId} deleted successfully` });
    } catch (err) {
        console.error('Error deleting resource:', err);
        res.status(500).json({ error: 'Failed to delete resource (check for child dependencies)', details: err.message });
    }
});


// ======================================================================
// === RESOURCE_ALLOCATION CRUD ROUTES (FIXED Column Name) ==============
// ======================================================================

// --- 9. API ROUTE: GET All Allocations (READ) ---
app.get('/api/allocation', async (req, res) => {
    const query = `
        SELECT 
            RA.ALLOCATION_ID,
            RA.EMG_ID,
            EE.DISASTER_TYPE AS EventType,
            RA.RES_ID,
            R.RESOURCE_TYPE AS ResourceType,
            RA.QUANTITY_NEEDED
        FROM 
            RESOURCE_ALLOCATION RA
        JOIN 
            EMERGENCY_EVENT EE ON RA.EMG_ID = EE.EMG_ID
        JOIN 
            RESOURCES R ON RA.RES_ID = R.RES_ID;
    `; 
    try {
        const [results] = await db.promise().query(query);
        res.status(200).json(results);
    } catch (err) {
        console.error('Error fetching allocations:', err);
        res.status(500).json({ error: 'Database query failed', details: err.message });
    }
});

// --- 10. API ROUTE: CREATE New Allocation (POST) ---
app.post('/api/allocation', async (req, res) => {
    const { EMG_ID, RES_ID, QUANTITY_NEEDED } = req.body; 
    const query = 'INSERT INTO RESOURCE_ALLOCATION (EMG_ID, RES_ID, QUANTITY_NEEDED) VALUES (?, ?, ?)';
    try {
        const [results] = await db.promise().query(query, [EMG_ID, RES_ID, QUANTITY_NEEDED]);
        res.status(201).json({ message: 'Allocation created successfully', id: results.insertId });
    } catch (err) {
        console.error('Error creating allocation:', err);
        res.status(500).json({ error: 'Failed to create allocation', details: err.message });
    }
});

// --- 11. API ROUTE: UPDATE Allocation by ID (PUT) ---
app.put('/api/allocation/:id', async (req, res) => {
    const allocationId = req.params.id;
    const { QUANTITY_NEEDED } = req.body; 
    const query = 'UPDATE RESOURCE_ALLOCATION SET QUANTITY_NEEDED = ? WHERE ALLOCATION_ID = ?';
    try {
        const [results] = await db.promise().query(query, [QUANTITY_NEEDED, allocationId]);
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Allocation not found or no changes made.' });
        }
        res.status(200).json({ message: `Allocation ID ${allocationId} updated successfully` });
    } catch (err) {
        console.error('Error updating allocation:', err);
        res.status(500).json({ error: 'Failed to update allocation', details: err.message });
    }
});

// --- 12. API ROUTE: DELETE Allocation by ID (DELETE) ---
app.delete('/api/allocation/:id', async (req, res) => {
    const allocationId = req.params.id;
    const query = 'DELETE FROM RESOURCE_ALLOCATION WHERE ALLOCATION_ID = ?'; 
    try {
        const [results] = await db.promise().query(query, [allocationId]);
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Allocation not found.' });
        }
        res.status(200).json({ message: `Allocation ID ${allocationId} deleted successfully` });
    } catch (err) {
        console.error('Error deleting allocation:', err);
        res.status(500).json({ error: 'Failed to delete allocation (check for child dependencies)', details: err.message });
    }
});


// --- START THE SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
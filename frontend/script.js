
const BACKEND_URL = 'http://localhost:5000'; 

// Helper function to show messages to the user
function displayMessage(text, isError = false) {
    const messageArea = document.getElementById('message-area');
    messageArea.textContent = text;
    messageArea.style.color = isError ? 'red' : 'green';
    setTimeout(() => {
        messageArea.textContent = ''; 
    }, 5000);
}



// 1. READ (GET) FUNCTION 
async function loadEmergencyEvents() {
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`${BACKEND_URL}/api/events?t=${timestamp}`); 
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const events = await response.json(); 
        const container = document.getElementById('events-container');
        container.innerHTML = ''; 

        if (events.length === 0) {
            container.innerHTML = '<p>No active events found in the database.</p>';
            return;
        }

        // Display list of events
        events.forEach(event => {
            const item = document.createElement('div');
            item.className = 'event-item';
            
            // Format the start date for better display
            const displayDate = event.START_DATE ? new Date(event.START_DATE).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            }) : 'N/A';

           
            item.innerHTML = `
                <div class="event-details" id="details-${event.EMG_ID}">
                    <strong>ID: ${event.EMG_ID}</strong> | 
                    Type: ${event.DISASTER_TYPE || 'N/A'} | 
                    Date: ${displayDate}
                </div>
                <div class="event-actions">
                    <button onclick="showEditForm(${event.EMG_ID})">Edit</button>
                    <button onclick="handleDeleteEvent(${event.EMG_ID})">Delete</button>
                </div>
            `;
            
            container.appendChild(item);
        });

    } catch (error) {
        console.error("Could not fetch events:", error);
        document.getElementById('events-container').innerHTML = `<p style="color: red;">Error: Failed to connect to API or retrieve data. Details: ${error.message}</p>`;
    }
}

//  2. CREATE (POST) FUNCTION 
async function handleCreateEvent(event) {
    event.preventDefault(); 
    
    const form = event.target;
    const formData = new FormData(form);
    const disasterType = formData.get('DISASTER_TYPE').trim();
    const startDate = formData.get('START_DATE');

    // Validation Check 
    if (!disasterType || !startDate) {
        displayMessage('Error: Type and Start Date are required.', true);
        return;
    }
    // End Validation 

    const eventData = {
        DISASTER_TYPE: disasterType,
        START_DATE: startDate
    };

    try {
        const response = await fetch(`${BACKEND_URL}/api/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });

        const result = await response.json();

        if (response.ok) {
            displayMessage(`Success! Event created with ID: ${result.id}`);
            form.reset(); 
            loadEmergencyEvents(); 
            loadAllocations(); 
        } else {
            displayMessage(`Error: ${result.error}. Details: ${result.details}`, true);
        }

    } catch (error) {
        displayMessage(`Network Error: ${error.message}`, true);
    }
}


// 3. DELETE FUNCTION 
async function handleDeleteEvent(id) {
    if (!confirm(`Are you sure you want to delete Event ID ${id}? This may fail if it has related records.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/events/${id}`, { method: 'DELETE' });

        const result = await response.json();

        if (response.ok) {
            displayMessage(`Successfully deleted Event ID ${id}`);
            loadEmergencyEvents(); 
            loadAllocations(); 
        } else {
            displayMessage(`Error deleting event: ${result.message || result.error}`, true);
        }
    } catch (error) {
        displayMessage(`Network Error: ${error.message}`, true);
    }
}


// 4. UPDATE (PUT) SHOW FORM FUNCTION 
async function showEditForm(id) {
    const timestamp = new Date().getTime();
    const response = await fetch(`${BACKEND_URL}/api/events?t=${timestamp}`); 
    const events = await response.json();
    const eventToEdit = events.find(e => e.EMG_ID === id);

    if (!eventToEdit) {
        displayMessage(`Error: Event ID ${id} not found.`, true);
        return;
    }
    
    
    const dateValue = eventToEdit.START_DATE ? new Date(eventToEdit.START_DATE).toISOString().split('T')[0] : '';


    // edit form HTML
    const editFormHTML = `
    <form id="edit-event-form-${id}" class="edit-form-section" onsubmit="event.preventDefault(); handleUpdateEvent(event, ${id})">
        <h4>Editing Event ID: ${id}</h4>
        
        <label for="edit_disaster_type">Type:</label>
        <input 
            type="text" 
            id="edit_disaster_type" 
            name="DISASTER_TYPE"  value="${eventToEdit.DISASTER_TYPE || ''}" 
            required
        ><br>

        <label for="edit_start_date">Start Date:</label>
        <input 
            type="date" 
            id="edit_start_date" 
            name="START_DATE" 
            value="${dateValue}" 
            required
        ><br>
        
        <button type="submit">Save Changes</button>
        <button type="button" onclick="loadEmergencyEvents()">Cancel</button>
    </form>
`;

    const container = document.getElementById(`details-${id}`).parentNode;
    container.innerHTML = editFormHTML;
}


//  5. UPDATE (PUT) - SUBMISSION HANDLER
async function handleUpdateEvent(event, id) {
    const form = event.target;
    const formData = new FormData(form);
    const updatedData = {
        DISASTER_TYPE: formData.get('DISASTER_TYPE'),
        START_DATE: formData.get('START_DATE')
    };

    try {
        const response = await fetch(`${BACKEND_URL}/api/events/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        const result = await response.json();

        if (response.ok) {
            displayMessage(`Success! ${result.message}`);
            loadEmergencyEvents(); 
            loadAllocations(); 
        } else {
            displayMessage(`Error updating event: ${result.error}. Details: ${result.details}`, true);
        }

    } catch (error) {
        displayMessage(`Network Error during update: ${error.message}`, true);
    }
}




//  6. READ (GET) RESOURCES FUNCTION
async function loadResources() {
    try {
        const timestamp = new Date().getTime();
        // This request now correctly expects RESOURCE_TYPE and LOCATION from server.js
        const response = await fetch(`${BACKEND_URL}/api/resources?t=${timestamp}`); 
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const resources = await response.json(); 
        const container = document.getElementById('resources-container');
        container.innerHTML = ''; 

        if (resources.length === 0) {
            container.innerHTML = '<p>No resources found in the database.</p>';
            return;
        }

        resources.forEach(resource => {
            const item = document.createElement('div');
            item.className = 'event-item'; 
            
            
            item.innerHTML = `
                <div class="event-details" id="resource-details-${resource.RES_ID}">
                    <strong>ID: ${resource.RES_ID}</strong> | 
                    Type: ${resource.RESOURCE_TYPE || 'N/A'} | 
                    Quantity: ${resource.QUANTITY || 0} | 
                    Location: ${resource.LOCATION || 'N/A'}
                </div>
                <div class="event-actions">
                    <button onclick="showEditResourceForm(${resource.RES_ID})">Edit</button>
                    <button onclick="handleDeleteResource(${resource.RES_ID})">Delete</button>
                </div>
            `;
            container.appendChild(item);
        });

    } catch (error) {
        console.error("Could not fetch resources:", error);
        document.getElementById('resources-container').innerHTML = `<p style="color: red;">Error loading resources: ${error.message}</p>`;
    }
}

// 7. CREATE (POST) RESOURCE FUNCTION
async function handleCreateResource(event) {
    event.preventDefault(); 
    const form = event.target;
    const formData = new FormData(form);
    
    const resourceType = formData.get('RESOURCE_TYPE').trim();
    const quantity = parseInt(formData.get('QUANTITY'));
    
    const location = formData.get('LOCATION').trim(); 

    // --- Validation Check ---
    if (!resourceType || isNaN(quantity) || quantity <= 0 || !location) {
        displayMessage('Error: Resource Type and Location are required, and Quantity must be a positive number.', true);
        return;
    }
    // --- End Validation ---
    
  
    const resourceData = {
        RESOURCE_TYPE: resourceType,
        QUANTITY: quantity,
        LOCATION: location
    };

    try {
        const response = await fetch(`${BACKEND_URL}/api/resources`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(resourceData)
        });

        const result = await response.json();

        if (response.ok) {
            displayMessage(`Success! Resource created with ID: ${result.id}`);
            form.reset(); 
            loadResources(); 
            loadAllocations(); 
        } else {
            displayMessage(`Error: ${result.error}. Details: ${result.details}`, true);
        }

    } catch (error) {
        displayMessage(`Network Error: ${error.message}`, true);
    }
}

// 8. DELETE RESOURCE FUNCTION 
async function handleDeleteResource(id) {
    if (!confirm(`Are you sure you want to delete Resource ID ${id}?`)) return;
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/resources/${id}`, { method: 'DELETE' });
        const result = await response.json();

        if (response.ok) {
            displayMessage(`Successfully deleted Resource ID ${id}`);
            loadResources(); 
        } else {
            displayMessage(`Error deleting resource: ${result.message || result.error}`, true);
        }
    } catch (error) {
        displayMessage(`Network Error: ${error.message}`, true);
    }
}

//  9. UPDATE (PUT) - SHOW RESOURCE FORM FUNCTION 
async function showEditResourceForm(id) {
    const timestamp = new Date().getTime();
    const response = await fetch(`${BACKEND_URL}/api/resources?t=${timestamp}`); 
    const resources = await response.json();
    const resourceToEdit = resources.find(r => r.RES_ID === id);

    if (!resourceToEdit) {
        displayMessage(`Error: Resource ID ${id} not found.`, true);
        return;
    }
    
    
    const editFormHTML = `
        <form id="edit-resource-form-${id}" class="edit-form-section" onsubmit="event.preventDefault(); handleUpdateResource(event, ${id})">
            <h4>Editing Resource ID: ${id}</h4>
            <label for="edit_resource_type">Type:</label>
            <input type="text" id="edit_resource_type" name="RESOURCE_TYPE" value="${resourceToEdit.RESOURCE_TYPE || ''}" required><br>

            <label for="edit_quantity">Quantity:</label>
            <input type="number" id="edit_quantity" name="QUANTITY" value="${resourceToEdit.QUANTITY || 0}" required><br>
            
            <label for="edit_location">Location:</label>
            <input type="text" id="edit_location" name="LOCATION" value="${resourceToEdit.LOCATION || ''}" required><br>

            <button type="submit">Save Changes</button>
            <button type="button" onclick="loadResources()">Cancel</button>
        </form>
    `;

    const container = document.getElementById(`resource-details-${id}`).parentNode;
    container.innerHTML = editFormHTML;
}

// 10. UPDATE (PUT) - RESOURCE SUBMISSION HANDLER 
async function handleUpdateResource(event, id) {
    const form = event.target;
    const formData = new FormData(form);
    
    
    const updatedData = {
        RESOURCE_TYPE: formData.get('RESOURCE_TYPE'),
        QUANTITY: parseInt(formData.get('QUANTITY')),
        LOCATION: formData.get('LOCATION') 
    };

    try {
        const response = await fetch(`${BACKEND_URL}/api/resources/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        const result = await response.json();

        if (response.ok) {
            displayMessage(`Success! ${result.message}`);
            loadResources(); 
            loadAllocations(); 
        } else {
            displayMessage(`Error updating resource: ${result.error}. Details: ${result.details}`, true);
        }

    } catch (error) {
        displayMessage(`Network Error during resource update: ${error.message}`, true);
    }
}




//  11. READ (GET) ALLOCATIONS FUNCTION 
async function loadAllocations() {
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`${BACKEND_URL}/api/allocation?t=${timestamp}`); 
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const allocations = await response.json(); 
        const container = document.getElementById('allocation-container');
        container.innerHTML = ''; 

        if (allocations.length === 0) {
            container.innerHTML = '<p>No resources are currently allocated to any event.</p>';
            return;
        }

        allocations.forEach(alloc => {
            const item = document.createElement('div');
            item.className = 'event-item'; 
            
            item.innerHTML = `
                <div class="event-details" id="allocation-details-${alloc.ALLOCATION_ID}">
                    <strong>ID: ${alloc.ALLOCATION_ID}</strong> | 
                    Event: ${alloc.EventType} (ID: ${alloc.EMG_ID}) | 
                    Resource: ${alloc.ResourceType} (ID: ${alloc.RES_ID}) |
                    Needed: ${alloc.QUANTITY_NEEDED} units
                </div>
                <div class="event-actions">
                    <button onclick="showEditAllocationForm(${alloc.ALLOCATION_ID})">Edit</button>
                    <button onclick="handleDeleteAllocation(${alloc.ALLOCATION_ID})">Delete</button>
                </div>
            `;
            container.appendChild(item);
        });

    } catch (error) {
        console.error("Could not fetch allocations:", error);
        document.getElementById('allocation-container').innerHTML = `<p style="color: red;">Error loading allocations: ${error.message}</p>`;
    }
}

//  12. CREATE (POST) ALLOCATION FUNCTION 
async function handleCreateAllocation(event) {
    event.preventDefault(); 
    const form = event.target;
    const formData = new FormData(form);

    const emgId = parseInt(formData.get('EMG_ID'));
    const resId = parseInt(formData.get('RES_ID'));
    const quantityNeeded = parseInt(formData.get('QUANTITY_NEEDED'));

    //  Validation Check 
    if (isNaN(emgId) || emgId <= 0 || isNaN(resId) || resId <= 0 || isNaN(quantityNeeded) || quantityNeeded <= 0) {
        displayMessage('Error: All IDs must be positive numbers, and Quantity Needed must be a positive number.', true);
        return;
    }
    //  End Validation 
    
    const allocationData = {
        EMG_ID: emgId,
        RES_ID: resId,
        QUANTITY_NEEDED: quantityNeeded,
    };

    try {
        const response = await fetch(`${BACKEND_URL}/api/allocation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(allocationData)
        });

        const result = await response.json();

        if (response.ok) {
            displayMessage(`Success! Allocation created with ID: ${result.id}`);
            form.reset(); 
            loadAllocations(); 
        } else {
            displayMessage(`Error: ${result.error}. Details: ${result.details}`, true);
        }

    } catch (error) {
        displayMessage(`Network Error: ${error.message}`, true);
    }
}

// 13. DELETE ALLOCATION FUNCTION 
async function handleDeleteAllocation(id) {
    if (!confirm(`Are you sure you want to delete Allocation ID ${id}?`)) return;
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/allocation/${id}`, { method: 'DELETE' });
        const result = await response.json();

        if (response.ok) {
            displayMessage(`Successfully deleted Allocation ID ${id}`);
            loadAllocations(); 
        } else {
            displayMessage(`Error deleting allocation: ${result.message || result.error}`, true);
        }
    } catch (error) {
        displayMessage(`Network Error: ${error.message}`, true);
    }
}

// 14. UPDATE (PUT) - SHOW ALLOCATION FORM FUNCTION 
async function showEditAllocationForm(id) {
    const timestamp = new Date().getTime();
    const response = await fetch(`${BACKEND_URL}/api/allocation?t=${timestamp}`); 
    const allocations = await response.json();
    const allocationToEdit = allocations.find(a => a.ALLOCATION_ID === id);

    if (!allocationToEdit) {
        displayMessage(`Error: Allocation ID ${id} not found.`, true);
        return;
    }
    
    
    const editFormHTML = `
        <form id="edit-allocation-form-${id}" class="edit-form-section" onsubmit="event.preventDefault(); handleUpdateAllocation(event, ${id})">
            <h4>Editing Allocation ID: ${id}</h4>
            <p>Event: ${allocationToEdit.EventType} | Resource: ${allocationToEdit.ResourceType}</p>

            <label for="edit_quantity_needed">Quantity Needed:</label>
            <input type="number" id="edit_quantity_needed" name="QUANTITY_NEEDED" value="${allocationToEdit.QUANTITY_NEEDED || 0}" required><br>

            <button type="submit">Save Changes</button>
            <button type="button" onclick="loadAllocations()">Cancel</button>
        </form>
    `;

    const container = document.getElementById(`allocation-details-${id}`).parentNode;
    container.innerHTML = editFormHTML;
}

// 15. UPDATE (PUT) - ALLOCATION SUBMISSION HANDLER 
async function handleUpdateAllocation(event, id) {
    const form = event.target;
    const formData = new FormData(form);
    const updatedData = {
        QUANTITY_NEEDED: parseInt(formData.get('QUANTITY_NEEDED')),
    };

    try {
        const response = await fetch(`${BACKEND_URL}/api/allocation/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        const result = await response.json();

        if (response.ok) {
            displayMessage(`Success! ${result.message}`);
            loadAllocations(); 
        } else {
            displayMessage(`Error updating allocation: ${result.error}. Details: ${result.details}`, true);
        }

    } catch (error) {
        displayMessage(`Network Error during allocation update: ${error.message}`, true);
    }
}


// --- INITIAL LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    loadEmergencyEvents();
    loadResources();
    loadAllocations();
    
  
    document.getElementById('create-event-form').addEventListener('submit', handleCreateEvent);
    document.getElementById('create-resource-form').addEventListener('submit', handleCreateResource);
    document.getElementById('create-allocation-form').addEventListener('submit', handleCreateAllocation);
});

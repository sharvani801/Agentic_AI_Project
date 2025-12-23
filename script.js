let attendanceList = JSON.parse(localStorage.getItem('attendanceList')) || [];

// Keyboard Arrow Navigation
document.addEventListener('keydown', (e) => {
    const inputs = ['studentId', 'studentName', 'attendanceDate', 'status'];
    const cur = inputs.indexOf(document.activeElement.id);
    if (e.key === 'ArrowDown' && cur < inputs.length - 1) document.getElementById(inputs[cur+1]).focus();
    if (e.key === 'ArrowUp' && cur > 0) document.getElementById(inputs[cur-1]).focus();
});

function markAttendance() {
    const id = document.getElementById('studentId').value.trim();
    const name = document.getElementById('studentName').value.trim();
    const date = document.getElementById('attendanceDate').value;
    const status = document.getElementById('status').value;
    if (!id || !name || !date) return alert("Fill all fields!");
    
    attendanceList.push({ id, name, date, status });
    saveAndRefresh();
}

function runAIAnalysis() {
    const panel = document.getElementById('aiAlertPanel');
    const msg = document.getElementById('aiAlertMessage');
    const uniqueIds = [...new Set(attendanceList.map(r => r.id))];
    let lowHTML = [];
    
    uniqueIds.forEach(sid => {
        const pct = parseFloat(calculateStudentPct(sid));
        if (pct < 75) {
            const name = attendanceList.find(r => r.id === sid).name;
            lowHTML.push(`<span class="critical-text">${name} (${pct}%)</span>`);
        }
    });
    
    panel.style.display = lowHTML.length ? 'block' : 'none';
    msg.innerHTML = lowHTML.length ? `Shortage: ${lowHTML.join('')}` : '';
}

function askAI() {
    const inputField = document.getElementById('chatInput');
    const input = inputField.value.trim().toLowerCase();
    const chatWindow = document.getElementById('chatWindow');
    if (!input) return;

    // 1. Display User Message
    chatWindow.innerHTML += `<div class="user-msg"><div class="msg-bubble">${input}</div></div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // 2. Get Student Data
    const id = prompt("Please enter the Student ID to verify records:");
    const records = attendanceList.filter(r => r.id === id);
    
    let response = "";

    if (records.length > 0) {
        const name = records[0].name;
        const total = records.length;
        const presentRecs = records.filter(r => r.status === 'Present');
        const absentRecs = records.filter(r => r.status === 'Absent');
        const currentPct = parseFloat(((presentRecs.length / total) * 100).toFixed(1));

        // 3. Logic for New Specific Queries
        
        // Query 1: Attendance Percentage
        if (input.includes("percentage") || input.includes("percent") || input.includes("much attendance")) {
            response = `📊 <strong>Attendance Report for ${name}:</strong><br>
                        Your current attendance is <strong>${currentPct}%</strong> based on ${total} total sessions.`;
        } 
        
        // Query 2: Present Days
        else if (input.includes("present days") || input.includes("how many days present")) {
            const dates = presentRecs.map(r => r.date).join(', ');
            response = `✅ <strong>Presence Summary:</strong><br>
                        You were present for <strong>${presentRecs.length}</strong> days.<br>
                        <small>Dates: ${dates || 'No records found'}</small>`;
        }

        // Query 3: Absent Days
        else if (input.includes("absent days") || input.includes("how many days absent") || input.includes("missed")) {
            const dates = absentRecs.map(r => r.date).join(', ');
            response = `❌ <strong>Absence Summary:</strong><br>
                        You were absent for <strong>${absentRecs.length}</strong> days.<br>
                        <small>Dates: ${dates || 'None (Perfect Attendance!)'}</small>`;
        }

        // Query 4: Shortage Status & Calculation
        else if (input.includes("shortage") || input.includes("risk") || input.includes("status") || input.includes("classes should i attend")) {
            if (currentPct < 75) {
                let needed = 0, t = total, p = presentRecs.length;
                while ((p / t) * 100 < 75) { t++; p++; needed++; }
                response = `⚠️ <strong>Shortage Alert:</strong><br>
                            Current: ${currentPct}% (Goal: 75%)<br>
                            Result: You have a shortage. You must attend the next <strong>${needed}</strong> classes without absence to clear the shortage.`;
            } else {
                let canMiss = 0, t = total, p = presentRecs.length;
                while (((p) / (t + 1)) * 100 >= 75) { t++; canMiss++; }
                response = `✅ <strong>Status: Normal</strong><br>
                            Current: ${currentPct}%<br>
                            Result: No shortage. You can safely miss <strong>${canMiss}</strong> more classes while staying above 75%.`;
            }
        }
        
        // Default Greeting
        else {
            response = `Hello ${name}! You can ask me for your <b>percentage</b>, <b>present days</b>, <b>absent days</b>, or <b>shortage status</b>.`;
        }
    } else {
        response = "🤖 <strong>Error:</strong> Student ID <strong>" + id + "</strong> not found in the system. Please ensure the ID is marked in the table first.";
    }

    // 4. Display AI Response with a slight delay for "thinking" feel
    setTimeout(() => {
        chatWindow.innerHTML += `<div class="ai-msg"><div class="msg-bubble">${response}</div></div>`;
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }, 600);

    inputField.value = '';
}

function calculateStudentPct(sid) {
    const records = attendanceList.filter(r => r.id === sid);
    const present = records.filter(r => r.status === 'Present').length;
    return records.length > 0 ? ((present / records.length) * 100).toFixed(1) + '%' : '0%';
}

function updateStats() {
    const total = attendanceList.length;
    const present = attendanceList.filter(r => r.status === 'Present').length;
    document.getElementById('totalRecords').innerText = total;
    document.getElementById('presentCount').innerText = present;
    document.getElementById('absentCount').innerText = total - present;
    document.getElementById('attendancePercentage').innerText = total > 0 ? ((present/total)*100).toFixed(1)+'%' : '0%';
}

function saveAndRefresh() {
    localStorage.setItem('attendanceList', JSON.stringify(attendanceList));
    displayAttendance();
}

function displayAttendance() {
    const tbody = document.getElementById('attendanceBody');
    tbody.innerHTML = ''; 
    const uniqueIds = [...new Set(attendanceList.map(r => r.id))];
    uniqueIds.forEach(sid => {
        const studentRecords = attendanceList.filter(r => r.id === sid);
        const name = studentRecords[0].name;
        const lastEntry = studentRecords[studentRecords.length - 1];
        const pct = calculateStudentPct(sid);
        tbody.innerHTML += `<tr>
            <td>${sid}</td><td>${name}</td><td>${lastEntry.date}</td><td>${lastEntry.status}</td>
            <td style="color:${parseFloat(pct) < 75 ? 'red' : 'green'}; font-weight:bold">${pct}</td>
            <td>
                <button onclick="viewHistory('${sid}')" class="view-btn">History</button>
                <button onclick="deleteByStudentId('${sid}')" class="delete-btn">Remove</button>
            </td>
        </tr>`;
    });
    updateStats();
    runAIAnalysis();
}

function viewHistory(sid) {
    const container = document.getElementById('calendarView');
    const records = attendanceList.filter(r => r.id === sid);
    document.getElementById('historyTitle').innerText = `History: ${records[0].name}`;
    container.innerHTML = '';
    attendanceList.forEach((rec, index) => {
        if (rec.id === sid) {
            const div = document.createElement('div');
            div.className = `history-item`;
            div.innerHTML = `<strong>${rec.date}</strong><br><span style="color:${rec.status === 'Present' ? 'green' : 'red'}">${rec.status}</span><br>
                             <button onclick="toggleStatus(${index}, '${sid}')" class="mini-edit-btn">Edit</button>`;
            container.appendChild(div);
        }
    });
    document.getElementById('historyModal').style.display = 'block';
}

function toggleStatus(index, sid) {
    attendanceList[index].status = attendanceList[index].status === 'Present' ? 'Absent' : 'Present';
    saveAndRefresh();
    viewHistory(sid);
}

function deleteByStudentId(sid) { if (confirm("Remove student?")) { attendanceList = attendanceList.filter(r => r.id !== sid); saveAndRefresh(); } }
function clearAllData() { if (confirm("Reset all?")) { attendanceList = []; saveAndRefresh(); } }
function closeHistory() { document.getElementById('historyModal').style.display = 'none'; }
window.onload = displayAttendance;
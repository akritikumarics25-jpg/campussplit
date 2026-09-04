/* ============================================================
   storage.js
   
   ============================================================ */

const STORAGE_KEY = "campussplit_data";


const DEFAULT_DATA = {
    groups: [
        {
            id: "Trip",
            name: "Goa Trip",
            type: "trip",
            members: ["You", "Isha", "Rahul", "Neha"]
        },
        {
            id: "pg-expenses",
            name: "PG Expenses",
            type: "pg",
            members: ["You", "Neha", "Isha"]
        }
    ],
    expenses: [],
    // "fromMember|toMember" -> true, once marked paid on the settlement page
    settledPayments: {}
};

function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            saveData(DEFAULT_DATA);
            return structuredClone(DEFAULT_DATA);
        }
        return JSON.parse(raw);
    } catch (err) {
        console.error("Failed to load CampusSplit data, resetting.", err);
        saveData(DEFAULT_DATA);
        return structuredClone(DEFAULT_DATA);
    }
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function makeId(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/**
 * Creates a group with whatever member names were typed in —
 * any number of them, not just 2 or 3. "You" is always included
 * once, even if the user also typed it themselves.
 */
function addGroup(name, type, memberNames) {
    const data = loadData();
    const cleanNames = memberNames.map(n => n.trim()).filter(Boolean);
    const uniqueMembers = ["You", ...cleanNames.filter(n => n.toLowerCase() !== "you")];

    const group = {
        id: makeId("group"),
        name,
        type,
        members: uniqueMembers
    };
    data.groups.push(group);
    saveData(data);
    return group;
}

function addExpense(expense) {
    const data = loadData();
    const record = {
        id: makeId("expense"),
        date: new Date().toISOString(),
        ...expense
    };
    data.expenses.push(record);
    saveData(data);
    return record;
}

function getGroupTotal(groupId) {
    const data = loadData();
    return data.expenses
        .filter(e => e.groupId === groupId)
        .reduce((sum, e) => sum + e.amount, 0);
}

function getOverallTotal() {
    const data = loadData();
    return data.expenses.reduce((sum, e) => sum + e.amount, 0);
}

function getGroupExpenses(groupId) {
    const data = loadData();
    return data.expenses.filter(e => e.groupId === groupId);
}

/**
 * Deletes a group and every expense that belongs to it.
 * Callers should check isGroupFullySettled() first — this function
 * itself does not block on outstanding balances.
 */
function deleteGroupAndExpenses(groupId) {
    const data = loadData();
    data.groups = data.groups.filter(g => g.id !== groupId);
    data.expenses = data.expenses.filter(e => e.groupId !== groupId);
    saveData(data);
}

function formatRupees(amount) {
    const rounded = Math.round(amount * 100) / 100;
    return "₹" + rounded.toLocaleString("en-IN");
}
